const { Types } = require("mongoose");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const checkinModel = require("../models/checkin");
const peerReviewModel = require("../models/peerReview");
const { InvalidObjectIdError, InvalidParametersError, GenericNotFoundError, ConfigurationError } = require("../errors/errors");
const { checkTeamRole, checkAssignmentRole } = require("../utility/auth");
const { daysBetween } = require("../utility/maths");
const { summariseMeetingAttendance } = require("./meetingController");
const ejs = require("ejs");
const archiver = require("archiver");
const path = require("path");
const { Readable } = require("stream");

generateTeamReportData = async (teamId) => {
  // Placeholder for the rendering object
  const renderObj = {};
  // Extract team details
  const team = await teamModel.findById(teamId).populate("members", "displayName email").lean();
  if (!team)
    throw new GenericNotFoundError("Unable to find the specified team.");
  // Make a helper for mapping user IDs to names for this team
  const idsToNames = team.members.reduce((acc, member) => {
    acc[member._id] = member.displayName;
    return acc;
  }, {});
  renderObj.teamNumber = team.teamNumber;
  renderObj.teamMembers = team.members;
  // Pull out meetings data
  const teamMeetings = await meetingModel.find({ team: teamId })
    .populate("attendance.attended attendance.apologies attendance.absent", "displayName")
    .sort({ "dateTime": 1 }).lean();
  const meetingData = { count: teamMeetings.length };
  if (teamMeetings.length >= 2) {
    const firstMeeting = teamMeetings[0];
    const lastMeeting = teamMeetings[teamMeetings.length - 1];
    meetingData.avgDaysBetween = Math.round(daysBetween(firstMeeting.dateTime, lastMeeting.dateTime) / teamMeetings.length);
  }
  renderObj.meetings = meetingData;
  renderObj.attendance = summariseMeetingAttendance(teamMeetings, "displayName");
  // Pull out the check-in/peer review data
  const checkins = await checkinModel.find({
    team: new Types.ObjectId(teamId),
  }).select("reviewer peerReview effortPoints").lean();
  const peerReviewPoints = await peerReviewModel.find({
    assignment: team.assignment,
    periodEnd: { $lt: new Date() },
  }).sort({ "periodStart": 1 }).lean();
  return renderObj;
};

/**
 * Produces exportable HTML-formatted reports about teams. Provide either team
 * or assignment.
 */
exports.generateTeamReports = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "supervisor/lecturer");
  const teamReportData = await generateTeamReportData(req.query.team);
  return res.render("reports/team", teamReportData);
};

exports.generateTeamReportsBulk = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  const teams = await teamModel.find({ assignment: req.query.assignment }).select("_id teamNumber").lean();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=reports.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res); 
  for (const team of teams) {
    const teamData = await generateTeamReportData(team._id);
    const html = await ejs.renderFile(
      path.join(__dirname, '..', 'views', 'reports', 'team.ejs'),
      teamData
    );
    const htmlBuffer = Buffer.from(html, 'utf-8');
    const stream = Readable.from(htmlBuffer);
    archive.append(stream, { name: `team-${team.teamNumber}.html` });
  }
  archive.finalize();
};
