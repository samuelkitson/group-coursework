const { Types } = require("mongoose");
const { json2csv } = require("json-2-csv");
const teamModel = require("../models/team");
const assignmentModel = require("../models/assignment");
const meetingModel = require("../models/meeting");
const checkinModel = require("../models/checkin");
const peerReviewModel = require("../models/peerReview");
const { bestWorstSkill, checkinStatistics, daysSince } = require("../utility/maths");
const { summariseMeetingAttendance } = require("./meetingController");
const { checkTeamRole, checkAssignmentRole } = require("../utility/auth");
const { InvalidObjectIdError, InvalidParametersError, GenericNotFoundError } = require("../errors/errors");

const generateTeamInsights = (teamData) => {
  const insights = [];
  // Generate meeting frequency insights
  if ((teamData?.meetingCount ?? 0) == 0) {
    insights.push({
      type: "severe",
      text: `No meetings yet`,
    });
  } else if (daysSince(teamData.lastMeetingDate) > 14) {
    insights.push({
      type: "severe",
      text: `Last meeting was ${daysSince(teamData.lastMeetingDate, false)}`,
    });
  } else if (daysSince(teamData.lastMeetingDate) > 7) {
    insights.push({
      type: "warning",
      text: `Last meeting was ${daysSince(teamData.lastMeetingDate, false)}`,
    });
  } else {
    insights.push({
      type: "positive",
      text: `Last meeting was ${daysSince(teamData.lastMeetingDate, false)}`,
    });
  }
  // Meeting attendance - only if there have been at least 2 meetings
  const attendanceRates = teamData.members.map(member => member.meetingAttendance.rate ?? 100);
  if (teamData.meetingCount >= 2) {
    if (attendanceRates.some(r => r < 40)) {
      insights.push({
        type: "severe",
        text: `Frequently absent members`,
      });
    } else if (attendanceRates.some(r => r < 70)) {
      insights.push({
        type: "warning",
        text: `Occasionally absent members`,
      });
    } else {
      insights.push({
        type: "positive",
        text: `Good meeting attendance`,
      });
    }
  }
  // Check-in net scores
  if (teamData?.checkInStats) {
    if (teamData?.checkInStats?.minNetScore <= -5 ) {
      insights.push({
        type: "severe",
        text: `Likely free-riding`,
      });
    } else if (teamData?.checkInStats?.minNetScore <= -4 ) {
      insights.push({
        type: "warning",
        text: `Potential free-riding`,
      });
    }
    if (teamData?.checkInStats?.maxNetScore >= 5 ) {
      insights.push({
        type: "warning",
        text: `One student doing most of the work`,
      });
    }
    if (teamData?.checkInStats?.minNetScore >= -3 && teamData?.checkInStats?.maxNetScore <= 4 ) {
      insights.push({
        type: "positive",
        text: `Good workload balance`,
      });
    }
  }
  // Check disputes
  if (teamData.disputes.outstanding > 0) {
    insights.push({
      type: "severe",
      text: "Outstanding disputes about meetings",
    });
  }
  if (teamData.disputes.escalate > 0) {
    insights.push({
      type: "severe",
      text: "Meeting disputes requiring escalation",
    });
  }
  // Show the most severe insights first
  const sortingOrder = { severe: 1, warning: 2, positive: 3 };
  return insights.sort((a, b) => (sortingOrder[a.type] || 4) - (sortingOrder[b.type] || 4));
};

/**
 * By default, includes full details about each team (including insights and
 * meeting data). For a simple list of team IDs and numbers for an assignment,
 * pass mode=simple in the query string.
 */
exports.getAllForAssignment = async (req, res) => {
  // Get and check permissions on the assignment object
  const role = await checkAssignmentRole(req.query.assignment, req.session.userId, "supervisor/lecturer");
  // Simple mode is enabled when the query parameter "mode" is set to "simple"
  if (req.query.mode === "simple") {
    let teams;
    if (role === "lecturer") {
      teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment) }).select("_id teamNumber").sort({ teamNumber: 1 }).lean();
    } else {
      teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment), supervisors: { $in: [req.session.userId] } }).select("_id teamNumber").sort({ teamNumber: 1 }).lean();
    }
    return res.json({ teams });
  }
  // Get the teams for this assignment (if supervisor, only show their teams)
  let teams;
  if (role === "lecturer") {
    teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment) }).populate("members supervisors", "email displayName").sort({ teamNumber: 1 }).lean();
  } else {
    teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment), supervisors: { $in: [req.session.userId] } }).populate("members supervisors", "email displayName").sort({ teamNumber: 1 }).lean();
  }
  // Add in their last meeting time/date
  let teamsWithLastMeeting = await Promise.all(
    teams.map(async (team) => {
      const teamMeetings = await meetingModel.find({ team: team._id })
        .sort({ dateTime: -1 })
        .lean();

      const attendanceStats = summariseMeetingAttendance(teamMeetings);

      const disputes = teamMeetings.flatMap(m => {
        return Array.isArray(m.disputes) ? m.disputes : []
      });

      const outstandingDisputes = disputes.filter(d => d.status === "outstanding");
      const escalateDisputes = disputes.filter(d => d.status === "escalate");

      team.members.map(student => {
        student.meetingAttendance = attendanceStats[student._id] ?? {attended: 0, apologies: 0, absent: 0, rate: 100, };
      });

      return {
        ...team,
        lastMeetingDate: teamMeetings[0] ? teamMeetings[0].dateTime : null,
        meetingCount: teamMeetings.length ?? 0,
        disputes: {
          outstanding: outstandingDisputes.length,
          escalate: escalateDisputes.length,
        }
      };
    })
  );
  // Add in check-in data
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const peerReview = await peerReviewModel.findByAssignment(req.query.assignment, lastWeekDate);
  if (!peerReview) {
    // No check-in data - maybe peer reviews aren't enabled?
    // TODO: use more than just last week's data
    teamsWithLastMeeting.forEach(team => {
      team.insights = [];
    });
  } else {
    const teamIds = teams.map(t => t._id);
    const checkins = await checkinModel.findByTeamsAndPeerReview(teamIds, peerReview._id, "reviewer team effortPoints");
    teamsWithLastMeeting.forEach(team => {
      const teamCheckins = checkins.filter(c => c.team.equals(team._id)) ?? [];
      const checkinStats = checkinStatistics(teamCheckins) ?? {netScores: {}, totalScores: {}};
      team.members.forEach(member => {
        member.checkinNetScore = checkinStats.netScores[member._id.toString()] ?? undefined;
      });
      team.checkInStats = {
        minNetScore: Math.min(...Object.values(checkinStats.netScores)),
        maxNetScore: Math.max(...Object.values(checkinStats.netScores)),
      };
      team.insights = generateTeamInsights(team);
    });
  }
  return res.json({teams: teamsWithLastMeeting});
};

exports.downloadTeamsCsv = async (req, res) => {
  // Get and check permissions on the assignment object
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  // Get the teams for this assignment
  const assignment = await assignmentModel.findById(req.query.assignment);
  const teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment) }).populate("members", "email").sort({ teamNumber: 1 }).lean();
  const studentsData = teams.flatMap(team => {
    return team.members.map(member => {
      return {student: member.email, team: team.teamNumber}
    });
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${assignment.name} - Teams.csv"`);
  return res.send(json2csv(studentsData));
};

exports.getMyTeam = async (req, res) => {
  // If assignment ID provided, check it's valid
  if (req.query.assignment && !Types.ObjectId.isValid(req.query.assignment))
    throw new InvalidObjectIdError("The provided assignment ID is invalid.");
  // Get the details of the user's teams
  const query = { $or: [
    { members: { $in: [req.session.userId] } },
    { supervisors: { $in: [req.session.userId] } }
  ]};
  if (req.query.assignment) {
    query.assignment = req.query.assignment;
  }
  const userTeams = await teamModel
    .find(query)
    .populate("members", "email displayName skills meetingPref bio")
    .populate("supervisors", "email displayName meetingPref bio")
    .lean();
  // Check whether the team was actually found or not
  if (userTeams == null) {
    throw new GenericNotFoundError("It doesn't look like you're currently on a team.");
  }
  // Get the required skills for this assignment
  if (req.query.assignment) {
    const assignment = await assignmentModel.findById(req.query.assignment);
    const requiredSkills = assignment?.skills?.map(s => s.name);
    userTeams.forEach(team => {
      team.members.forEach(student => {
        const bestSkill = bestWorstSkill(student.skills ?? [], true, requiredSkills);
        const worstSkill = bestWorstSkill(student.skills ?? [], false, requiredSkills);
        student.skills = { strongest: bestSkill, weakest: worstSkill };
      });
    });
  }
  return res.json({teams: userTeams});
};

exports.addMember = async (req, res) => {
  await checkTeamRole(req.params.team, req.session.userId, "lecturer");
  // Check valid student ID
  if (req.body.student && !Types.ObjectId.isValid(req.body.student))
    throw new InvalidObjectIdError("The provided student ID is invalid.");
  // Get the team object and check permissions
  const team = await teamModel.findById(req.params.team);
  // Remove the student from their previous team on this assignment
  const removedStudents = await teamModel.updateMany(
    { assignment: team.assignment, members: { $in: req.body.student }},
    { $pull: { members: req.body.student }},
  );
  if (removedStudents.modifiedCount === 0)
    throw new GenericNotFoundError("Student not found. Please try again.");
  team.members.push(req.body.student);
  await team.save();
  return res.json({message: "Student moved to new team successfully. Please contact the student to let them know."});
};
