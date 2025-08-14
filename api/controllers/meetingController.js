const observationModel = require("../models/observation");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const { Types } = require("mongoose");
const { checkTeamRole } = require("../utility/auth");
const { GenericNotFoundError, InvalidParametersError, GenericNotAllowedError, AssignmentInvalidStateError } = require("../errors/errors");
const { hoursSince } = require("../utility/maths");
const { format } = require("date-fns/format");
const assignment = require("../models/assignment");

// Provide the team ID in query params
exports.getMeetingsForTeam = async (req, res) => {
  const userRole = await checkTeamRole(req.query.team, req.session.userId, "member/supervisor/lecturer");
  let query = meetingModel.find({ team: req.query.team, });
  if (userRole === "member") query = query.select("-disputes");
  // Get meeting documents for the team
  const meetingHistory = await query.populate("minuteTaker attendance.attended attendance.apologies attendance.absent previousActions.assignees newActions.assignees disputes.complainant editLog.editor", "displayName").sort({ dateTime: -1 }).lean();
  const attendanceStats = this.summariseMeetingAttendance(meetingHistory, "displayName");
  return res.json({ meetings: meetingHistory, attendanceStats: attendanceStats, });
};

exports.recordNewMeeting = async (req, res) => {
  await checkTeamRole(req.body.team, req.session.userId, "member");
  // Get the team details
  const teamInfo = await teamModel.findById(req.body.team).select("members").populate("assignment", "state").lean();
  if (teamInfo?.assignment?.state === "closed")
    throw new AssignmentInvalidStateError("This assignment is closed.");
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
  // Check that this new meeting's date is after the previous meeting
  const lastMeeting = await meetingModel.findOne({ team: req.body.team }).select("dateTime").sort({date: -1});
  if (lastMeeting) {
    if (dateTime <= lastMeeting?.dateTime)
      throw new InvalidParametersError("Meeting date must be after the previous meeting.");
  }
  // Make sure that all team members are accounted for in the attendance logs 
  const membersInAttendance = (req.body.attendance?.["attended"] ?? []).flat().map(id => id.toString());
  const membersApologies = (req.body.attendance?.["apologies"] ?? []).flat().map(id => id.toString());
  const membersAbsent = (req.body.attendance?.["absent"] ?? []).flat().map(id => id.toString());
  const membersAccountedFor = membersInAttendance.concat(membersApologies, membersAbsent);
  if (!teamMembers.every(id => membersAccountedFor.includes(id))) {
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

exports.updateMeeting = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.meeting))
    throw new InvalidObjectIdError("The provided meeting ID is invalid.");
  // Try to fetch the meeting so we can check the team
  const meeting = await meetingModel.findById(req.params.meeting);
  if (!meeting)
    throw new GenericNotFoundError("The meeting could not be found.");
  const userRole = await checkTeamRole(meeting.team, req.session.userId, "member/supervisor/lecturer");
  // If this is a student, check that they're the minute taker and that this is
  // within an hour of the meeting being added
  if (userRole === "member") {
    const minuteTakerMatch = meeting.minuteTaker._id.equals(req.session.userId);
    const withinHour = hoursSince(meeting?.createdAt) < 1;
    if (!(minuteTakerMatch && withinHour))
      throw new GenericNotAllowedError("You're not able to delete this meeting. Please ask your supervisor or lecturer for help.");
  }
  // Safe to edit the meeting
  // Get the team details
  const teamInfo = await teamModel.findById(meeting.team).select("members").populate("assignment", "state").lean();
  if (teamInfo?.assignment?.state === "closed")
    throw new AssignmentInvalidStateError("This assignment is closed.");
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
  if (!teamMembers.every(id => membersAccountedFor.includes(id))) {
    return res.status(400).json({ message: "You need to record the meeting attendance for each team member." });
  }
  // Process the meeting edit
  meeting.discussion = discussion;
  meeting.dateTime = dateTime;
  meeting.location = location;
  meeting.attendance = {
    attended: membersInAttendance,
    apologies: membersApologies,
    absent: membersAbsent,
  };
  meeting.previousActions = req.body.previousActions;
  meeting.newActions = req.body.newActions;
  meeting.editLog.push({ editor: req.session.userId, dateTime: new Date(), });
  await meeting.save();
  return res.json({ message: "Meeting updated successfully. "});
};

exports.deleteMeeting = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.meeting))
    throw new InvalidObjectIdError("The provided meeting ID is invalid.");
  // Try to fetch the meeting so we can check the team
  const meeting = await meetingModel.findById(req.params.meeting).populate("disputes.complainant", "displayName");
  if (!meeting)
    throw new GenericNotFoundError("The meeting could not be found.");
  const userRole = await checkTeamRole(meeting.team, req.session.userId, "member/supervisor/lecturer");
  // If this is a student, check that they're the minute taker and that this is
  // within an hour of the meeting being added
  if (userRole === "member") {
    const minuteTakerMatch = meeting.minuteTaker._id.equals(req.session.userId);
    const withinHour = hoursSince(meeting?.createdAt) < 1;
    if (!(minuteTakerMatch && withinHour))
      throw new GenericNotAllowedError("You're not able to delete this meeting. Please ask your supervisor or lecturer for help.");
  }
  // Safe to delete the meeting
  await meeting.deleteOne();
  // If there were disputes, record an automatic observation. Only do this if
  // "deleter" isn't the minute-taker, i.e. is the supervisor/lecturer.
  if (meeting?.disputes?.length > 0 && meeting.minuteTaker.toString() != req.session.userId) {
    const complainants = [... new Set(meeting.disputes.flatMap(d => d?.complainant?.displayName).filter(Boolean))].join(", ");
    const observation = {
      team: meeting.team,
      observer: req.session.userId,
      comment: `[Automated] This user deleted a meeting record for ${format(meeting?.dateTime, "dd/MM/yyyy")} that had outstanding disputes from: ${complainants}.`,
    };
    await observationModel.create(observation);
  } else {
    console.log("test case 1");
  }
  return res.json({ message: "The meeting has been deleted successfully." });
};

exports.addMeetingDispute = async (req, res) => {
  if (!req.body.notes)
    throw new InvalidParametersError("You must provide details of the dispute.");
  if (typeof req.body.notes !== "string" || req.body.notes?.length < 100)
    throw new InvalidParametersError("Please provide a longer dispute comment.");
  if (!Types.ObjectId.isValid(req.params.meeting))
    throw new InvalidObjectIdError("The provided meeting ID is invalid.");
  // Try to fetch the meeting so we can check the team
  const meeting = await meetingModel.findById(req.params.meeting);
  if (!meeting)
    throw new GenericNotFoundError("The meeting could not be found.");
  await checkTeamRole(meeting.team, req.session.userId, "member");
  // Create new dispute
  const dispute = {
    complainant: req.session.userId,
    notes: req.body.notes,
    status: "outstanding",
  };
  meeting.disputes.push(dispute);
  await meeting.save();
  return res.json({ message: "Your dispute has been logged and will be read by your supervisor or the module team." });
};

exports.updateMeetingDispute = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.meeting))
    throw new InvalidObjectIdError("The provided meeting ID is invalid.");
  if (!Types.ObjectId.isValid(req.body.dispute))
    throw new InvalidObjectIdError("The provided dispute ID is invalid.");
  if (!req.body.status || !["outstanding", "escalate", "resolved", "ignore"].includes(req.body.status))
    throw new InvalidParametersError("You must provide a valid new status for the dispute.");
  // Try to fetch the meeting so we can check the team
  const meeting = await meetingModel.findById(req.params.meeting);
  if (!meeting)
    throw new GenericNotFoundError("The meeting could not be found.");
  await checkTeamRole(meeting.team, req.session.userId, "supervisor/lecturer");
  let updated = false;
  meeting.disputes.forEach(d => {
    if (d._id.equals(req.body.dispute)) {
      d.status = req.body.status;
      updated = true;
    }
  });
  if (!updated)
    throw new GenericNotFoundError("The dispute could not be found in that meeting.");
  await meeting.save();
  return res.json({ message: `The dispute has been marked as ${req.body.status}.` });
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

exports.summariseMeetingMinuteTakers = (meetingLogs, embeddedField=null) => {
  const minuteTakers = {};
  meetingLogs.forEach(meeting => {
    const studentId = embeddedField ? meeting.minuteTaker[embeddedField].toString() : meeting.minuteTaker;
    if (!minuteTakers.hasOwnProperty(studentId)) {
      minuteTakers[studentId] = 1;
    } else {
      minuteTakers[studentId] += 1;
    }
  });
  return minuteTakers;
};

exports.summariseMeetingActions = (meetingLogs) => {
  const actionOwners = {};
  meetingLogs.forEach(meeting => {
    (meeting.previousActions ?? []).forEach(action => {
      action.assignees.forEach(assignee => {
        if (!actionOwners.hasOwnProperty(assignee)) {
          actionOwners[assignee] = { complete: 0, incomplete: 0, };
        }
        if (action.complete) {
          actionOwners[assignee].complete += 1;
        } else {
          actionOwners[assignee].incomplete += 1;
        }
      });
    });
  });
  Object.keys(actionOwners).forEach(student => {
    const actionObj = actionOwners[student];
    const actionRate = (actionObj.complete / (actionObj.complete + actionObj.incomplete)) ?? 0;
    actionOwners[student].rate = Math.round(actionRate * 100);
    actionOwners[student].total = actionObj.complete + actionObj.incomplete;
  });
  return actionOwners;
};
