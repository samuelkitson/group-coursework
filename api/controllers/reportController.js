const { Types } = require("mongoose");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const checkinModel = require("../models/checkin");
const peerReviewModel = require("../models/peerReview");
const { InvalidObjectIdError, InvalidParametersError, GenericNotFoundError, ConfigurationError } = require("../errors/errors");
const { checkTeamRole, checkAssignmentRole } = require("../utility/auth");
const { daysBetween, peerReviewSkillsStatistics, calculateAverage } = require("../utility/maths");
const { summariseMeetingAttendance, summariseMeetingMinuteTakers, summariseMeetingActions } = require("./meetingController");
const ejs = require("ejs");
const archiver = require("archiver");
const path = require("path");
const { Readable } = require("stream");
const { parseISO, format } = require("date-fns");

/**
 * Helper function to generate the summary data required to render the team.ejs
 * report template. The object returned from this function will be sufficient to
 * render a report.
 * 
 * team: a lean Mongoose object for the relevant team. Ensure both members and
 *   supervisors are populated with email and displayName.
 * assignment: a lean Mongoose object for the relevant assignment. Should only
 *   need the name field.
 * peerReview: a lean Mongoose object for the relevant peer review point to
 *   generate the summary report for. If not provided (e.g. if peer reviews are
 *   not enabled for this assignment), a report of the other data can still be
 *   generated.
 */
summariseTeamData = async (team, assignment, peerReview, periodStart, periodEnd) => {
  // Placeholder for the rendering object
  const renderObj = {};
  // Add report generation date
  currentDate = new Date();
  renderObj.generatedDate = format(currentDate, "dd/MM/yyyy");
  // Add in assignment name and supervisors list
  renderObj.assignmentName = assignment?.name ?? "Unknown assignment";
  renderObj.supervisors = (team?.supervisors ?? []).map(s => s.displayName);
  // Make a helper for mapping user IDs to names for this team
  const idsToNames = team.members.reduce((acc, member) => {
    acc[member._id] = member.displayName;
    return acc;
  }, {});
  renderObj.teamNumber = team.teamNumber;
  renderObj.teamMembers = team.members;
  // Pull out meetings data
  const teamMeetings = await meetingModel.find({ team: team._id, dateTime: { $lte: periodEnd, $gte: periodStart, } })
    .populate("attendance.attended attendance.apologies attendance.absent minuteTaker", "displayName")
    .sort({ "dateTime": 1 }).lean();
  const meetingData = { count: teamMeetings.length };
  if (teamMeetings.length >= 2) {
    const firstMeeting = teamMeetings[0];
    const lastMeeting = teamMeetings[teamMeetings.length - 1];
    meetingData.avgDaysBetween = Math.round(daysBetween(firstMeeting.dateTime, lastMeeting.dateTime) / teamMeetings.length);
  }
  renderObj.meetings = meetingData;
  renderObj.attendance = summariseMeetingAttendance(teamMeetings, "displayName");
  renderObj.minuteTakers = summariseMeetingMinuteTakers(teamMeetings, "displayName");
  const actionOwnerStats = summariseMeetingActions(teamMeetings);
  renderObj.actionOwners = Object.keys(actionOwnerStats).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: actionOwnerStats[id] }), {});
  // Pull out the check-in/peer review data
  // const checkins = await checkinModel.find({
  //   team: new Types.ObjectId(team._id),
  // }).select("reviewer peerReview effortPoints").lean();
  // If fetching details of a specific peer review, pull out skills & comments
  if (peerReview) {
    renderObj.peerReview = {};
    renderObj.peerReview.periodStart = format(peerReview.periodStart, "dd/MM/yyyy");
    const fullReviews = await checkinModel.find({
      team: new Types.ObjectId(team._id),
      peerReview: peerReview._id,
    }).select("_id reviewer effortPoints reviews");
    // Add in comments
    const commentsByRecipient = {};
    for (const review of fullReviews) {
      const reviewerName = idsToNames[review.reviewer] ?? "[Ex-team member]";
      Object.keys(review?.reviews ?? {}).forEach(forId => {
        const recipientName = idsToNames[forId] ?? "[Ex-team member]";
        const commentObj = {"comment": review.reviews[forId].comment, "by": reviewerName, "moderated": false};
        if (review.reviews[forId].originalComment) commentObj.moderated = true;
        if (!commentsByRecipient.hasOwnProperty(recipientName)) {
          commentsByRecipient[recipientName] = [commentObj];
        } else {
          commentsByRecipient[recipientName].push(commentObj);
        }
      });
    }
    renderObj.reviewComments = commentsByRecipient;
    // Add in skill ratings
    const skillsRatingsSummary = peerReviewSkillsStatistics(fullReviews, averages=true);
    renderObj.skillRatings = Object.keys(skillsRatingsSummary).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: skillsRatingsSummary[id] }), {});
  }
  return renderObj;
};

/**
 * Helper function to pre-load team and peer review point data before calling
 * summariseTeamData for each team. Provide either assignmentId or teamID.
 * Optionally provide peerReviewId, otherwise the most recent full review point
 * will be used by default (or none if this doesn't exist). Returns an array of
 * team data objects, each of which can be used to render a report.
 * 
 * This can also be configured to return data for a specified period using
 * periodStart and periodEnd. When neither is provided, the function defaults to
 * fetching data from all time. When periodStart is left blank, it defaults to
 * fetching data from the beginning of the assignment. When periodEnd is left
 * blank, it defaults to fetching data up until today.
 * 
 * @param {ObjectId} assignmentId MongoDB ID for the assignment
 * @param {ObjectId} teamId MongoDB ID for the team (required if assignmentId not provided)
 * @param {ObjectId} peerReviewId MongoDB ID for the peer review point (optionalm, but must fall within the search period)
 * @param {dateTime} startDate the start date of the report period
 * @param {dateTime} endDate the end date of the report period
 */
generateDataForTeams = async ({ assignmentId, teamId, peerReviewId, periodStart, periodEnd }) => {
  // Set start and end dates for the search period
  const searchStartDate = Date.parse(periodStart) || new Date(2020, 0, 1);
  const searchEndDate = Date.parse(periodEnd) || new Date();
  // Create a query object to search either by team or assignment
  const generatedReportObjects = [];
  let teamQuery = {};
  if (teamId) {
    teamQuery = { _id: new Types.ObjectId(teamId) };
  } else if (assignmentId) {
    teamQuery = { assignment: new Types.ObjectId(assignmentId) };
  } else {
    throw new InvalidParametersError("Provide either an assignment or team ID to generate reports.");
  }
  // Fetch all of the required team details to reduce future database queries
  const teams = await teamModel.find(teamQuery)
    .populate("members supervisors", "displayName email").lean();
  if (teams.length === 0)
    throw new GenericNotFoundError("No teams found.");
  // Fetch assignment info
  const assignmentInfo = await assignmentModel.findById(assignmentId ?? teams[0].assignment).select("name").lean();
  if (!assignmentInfo)
    throw new GenericNotFoundError("Assignment not found.");
  // Fetch peer review point data
  let peerReviewDetails;
  if (peerReviewId) {
    const foundReviews = await peerReviewModel.find({
      _id: new Types.ObjectId(peerReviewId),
      assignment: assignmentInfo._id,
      periodStart: { $gte: searchStartDate, },
      periodEnd: { $lte: searchEndDate, },
    });
    if (foundReviews.length === 0)
      throw new GenericNotFoundError("That peer review could not be found for this assignment.");
    peerReviewDetails = foundReviews[0];
  } else {
    const foundReviews = await peerReviewModel.find({
      assignment: assignmentInfo._id,
      periodStart: { $gte: searchStartDate, },
      periodEnd: { $lte: searchEndDate, },
      type: "full",
    }).sort({ periodStart: -1, }).lean();
    if (foundReviews.length === 0) {
      peerReviewDetails = null;
    } else {
      peerReviewDetails = foundReviews[0];
    }
  }
  // Now generate the reports for each team
  for (const team of teams) {
    const teamData = await summariseTeamData(team, assignmentInfo, peerReviewDetails, searchStartDate, searchEndDate);
    generatedReportObjects.push(teamData);
  }
  return generatedReportObjects;
};

/**
 * Produces exportable HTML-formatted reports about teams. Provide either team
 * or assignment.
 */
exports.generateTeamReports = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "supervisor/lecturer");
  if (req.query.peerReview && !Types.ObjectId.isValid(req.query.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid."); 
  const teamReportData = await generateDataForTeams({ teamId: req.query.team, peerReviewId: req.query.peerReview, periodStart: req.query.periodStart, periodEnd: req.query.periodEnd, });
  return res.render("reports/team", teamReportData[0]);
};

/**
 * Similar to above, but produces a ZIP of HTML reports, one for each team in a
 * given assignment.
 */
exports.generateTeamReportsBulk = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  if (req.query.peerReview && !Types.ObjectId.isValid(req.query.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid.");
  // Setup zip response
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=reports.zip");
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);
  // Generate data about teams
  const teamReportData = await generateDataForTeams({ assignmentId: req.query.assignment, peerReviewId: req.query.peerReview, periodStart: req.query.periodStart, periodEnd: req.query.periodEnd, });
  for (const report of teamReportData) {
    const html = await ejs.renderFile(path.join(__dirname, "..", "views", "reports", "team.ejs"), report);
    const htmlBuffer = Buffer.from(html, "utf-8");
    const stream = Readable.from(htmlBuffer);
    archive.append(stream, { name: `team-${report.teamNumber}.html` });
  }
  archive.finalize();
};
