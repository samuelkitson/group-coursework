const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const { Types } = require("mongoose");
const { checkTeamRole } = require("../utility/auth");

// Provide the team ID in query params
exports.getMeetingsForTeam = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "member/supervisor/lecturer");
  // Get meeting documents for the team
  const meetingHistory = await meetingModel.find({
    team: req.query.team,
  }).populate("minuteTaker attendance.attended attendance.apologies attendance.absent previousActions.assignees newActions.assignees", "displayName").sort({ dateTime: -1 }).lean();
  const attendanceStats = this.summariseMeetingAttendance(meetingHistory, "displayName");
  return res.json({ meetings: meetingHistory, attendanceStats: attendanceStats, });
};

exports.recordNewMeeting = async (req, res) => {
  await checkTeamRole(req.body.team, req.session.userId, "member");
  // Get the team details
  const teamInfo = await teamModel.findById(req.body.team).select("members").lean();
  const teamMembers = teamInfo.members.map(id => id.toString());
  // Validate incoming data
  const location = req.body.location;
  if (!location)
    return res.status(400).json({ message: "You must provide a meeting location." });
  const dateTime = new Date(req.body.dateTime);
  if (!dateTime) return res.status(400).json({ message: "You must provide a meeting date and time." });
  const now = new Date();
  if (dateTime > now) return res.status(400).json({ message: "The meeting date and time can't be in the future." });
  const discussion = req.body.discussion;
  if (!discussion)
    return res.status(400).json({ message: "You must provide a summary of the meeting discussion." });
  // Make sure that all team members are accounted for in the attendance logs 
  const membersInAttendance = (req.body.attendance?.["attended"] ?? []).flat().map(id => id.toString());
  const membersApologies = (req.body.attendance?.["apologies"] ?? []).flat().map(id => id.toString());
  const membersAbsent = (req.body.attendance?.["absent"] ?? []).flat().map(id => id.toString());
  const membersAccountedFor = membersInAttendance.concat(membersApologies, membersAbsent);
  if (membersAccountedFor.length != teamMembers.length || !membersAccountedFor.every(id => teamMembers.includes(id))) {
    return res.status(400).json({ message: "You need to record the meeting attendance for each team member." });
  }
  // Build new meeting object
  const meetingObj = {
    team: req.body.team,
    discussion,
    dateTime,
    minuteTaker: req.session.userId,
    location,
    attendance: {
      attended: membersInAttendance,
      apologies: membersApologies,
      absent: membersAbsent,
    },
    previousActions: req.body.previousActions,
    newActions: req.body.newActions,
  }
  await meetingModel.create(meetingObj);
  return res.json({ message: "Meeting recorded successfully. "});
};

/*
* If the meeting attendance data has already been populated, set the
* embeddedField parameter to the key to use to identify students in the response
* object. For example, displayName.
*/
exports.summariseMeetingAttendance = (meetingLogs, embeddedField=null) => {
  const attendance = {};
  
  const updateAttendance = (meeting, attendanceType) => {
    (meeting.attendance[attendanceType] ?? []).forEach(student => {
      const studentId = embeddedField ? student[embeddedField].toString() : student;
      if (!attendance.hasOwnProperty(studentId)) {
        attendance[studentId] = {attended: 0, apologies: 0, absent: 0};
      }
      attendance[studentId][attendanceType] += 1;
    })
  };

  meetingLogs.forEach(meeting => {
    updateAttendance(meeting, "attended");
    updateAttendance(meeting, "apologies");
    updateAttendance(meeting, "absent");
  });

  Object.keys(attendance).forEach(student => {
    const attendanceObj = attendance[student];
    const meetingSum = attendanceObj.attended + attendanceObj.apologies + attendanceObj.absent;
    if (meetingSum === 0) {
      attendance[student]["rate"] = 0
    } else {
      attendance[student]["rate"] = Math.round((attendanceObj.attended / meetingSum) * 100);
    }
  })

  return attendance;
};
