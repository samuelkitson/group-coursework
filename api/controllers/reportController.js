const { Types } = require("mongoose");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const checkinModel = require("../models/checkin");
const peerReviewModel = require("../models/peerReview");
const observationModel = require("../models/observation");
const { InvalidObjectIdError, InvalidParametersError, GenericNotFoundError, ConfigurationError } = require("../errors/errors");
const { checkTeamRole, checkAssignmentRole } = require("../utility/auth");
const { daysBetween, peerReviewSkillsStatistics, calculateAverage, averageObjectValues, objectArrayToObject } = require("../utility/maths");
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
summariseTeamData = async ({ team, assignment, peerReview, peerReviewCount, periodStart, periodEnd, }) => {
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
  const teamMemberMap = objectArrayToObject(team.members, "_id");
  renderObj.members = teamMemberMap;
  const studentDataToMerge = {};
  // Pull out meetings data
  const teamMeetings = await meetingModel.find({ team: team._id, dateTime: { $lte: periodEnd, $gte: periodStart, } })
    .sort({ "dateTime": 1 }).lean();
  const meetingData = { count: teamMeetings.length };
  if (teamMeetings.length >= 2) {
    const firstMeeting = teamMeetings[0];
    const lastMeeting = teamMeetings[teamMeetings.length - 1];
    meetingData.avgDaysBetween = Math.round(daysBetween(firstMeeting.dateTime, lastMeeting.dateTime) / teamMeetings.length);
  };
  meetingData.actionsCount = teamMeetings.flatMap(m => m?.newActions ?? []).length;
  renderObj.meetings = meetingData;
  studentDataToMerge.attendance = summariseMeetingAttendance(teamMeetings);
  studentDataToMerge.minutesRecorded = summariseMeetingMinuteTakers(teamMeetings);
  studentDataToMerge.meetingActions = summariseMeetingActions(teamMeetings);
  // If fetching details of a specific peer review, pull out skills & comments.
  if (peerReview) {
    renderObj.peerReview = {};
    renderObj.peerReview.periodStart = format(peerReview.periodStart, "dd/MM/yyyy");
    renderObj.peerReview.name = peerReview.name;
    const fullReviews = await checkinModel.find({
      team: new Types.ObjectId(team._id),
      peerReview: peerReview._id,
    }).select("_id reviewer effortPoints reviews");
    // Add in comments
    const commentsByRecipient = {};
    const commentLengthByReviewer = {};
    for (const review of fullReviews) {
      const reviewerName = idsToNames[review.reviewer] ?? "[Ex-team member]";
      Object.keys(review?.reviews ?? {}).forEach(forId => {
        const recipientName = idsToNames[forId] ?? "[Ex-team member]";
        const commentObj = {"comment": review.reviews[forId].comment, "by": reviewerName, "moderated": false};
        if (review.reviews[forId].originalComment) commentObj.moderated = true;
        if (!commentsByRecipient.hasOwnProperty(forId)) {
          commentsByRecipient[forId] = [commentObj];
        } else {
          commentsByRecipient[forId].push(commentObj);
        }
        // Keep track of the comment lengths by each reviewer.
        const wordCount = (commentObj?.originalComment ?? commentObj?.comment)?.length ?? 0;
        if (!commentLengthByReviewer.hasOwnProperty(review.reviewer)) {
          commentLengthByReviewer[review.reviewer] = wordCount;
        } else {
          commentLengthByReviewer[review.reviewer] += wordCount;
        }
      });
    }
    // Normalise the comment lengths.
    Object.keys(commentLengthByReviewer).forEach(function(key, index) {
      const normalised = commentLengthByReviewer[key] / team.members.length ?? 0;
      commentLengthByReviewer[key] = Math.round(normalised);
    });
    studentDataToMerge.reviewComments = commentsByRecipient;
    studentDataToMerge.commentLength = commentLengthByReviewer;
    // Add in skill ratings.
    studentDataToMerge.skillRatings = peerReviewSkillsStatistics(fullReviews, averages=true);
  }
  // Add in workload balance scores from check-ins
  const allCheckins = await checkinModel.aggregate([
    { $match: { team: team._id }},
    { $lookup: { from: "peerreviews", localField: "peerReview", foreignField: "_id", as: "peerReviewFiltered", }},
    { $unwind: { path: "$peerReviewFiltered", preserveNullAndEmptyArrays: false, }},
    { $match :{ "peerReviewFiltered.periodStart": { $gte: periodStart, $lte: periodEnd, }}},
    { $project: { _id: 1, peerReview: "$peerReviewFiltered", effortPoints: 1, reviewer: 1, }}
  ]);
  if (allCheckins.length > 0) {
    const checkinsGrouped = {};
    const peerScoresEach = {};
    const selfScoresEach = {};
    const checkinsSubmitted = {};
    allCheckins.forEach(checkin => {
      const reviewId = checkin?.peerReview?._id;
      if (!reviewId) return;
      if (!checkinsGrouped.hasOwnProperty(reviewId))
        checkinsGrouped[reviewId] = {};
      for (const recipient in checkin.effortPoints) {
        const pointsAdjusted = checkin.effortPoints[recipient] - 4;
        checkinsGrouped[reviewId][recipient] = (checkinsGrouped[reviewId][recipient] || 0) + pointsAdjusted;
        if (checkin.reviewer == recipient) {
          if (selfScoresEach.hasOwnProperty(recipient)) {
            selfScoresEach[recipient].push(pointsAdjusted)
          } else {
            selfScoresEach[recipient] = [pointsAdjusted];
          }
          checkinsSubmitted[recipient] = (checkinsSubmitted[recipient] || 0) + 1;
        } else {
          if (peerScoresEach.hasOwnProperty(recipient)) {
            peerScoresEach[recipient].push(pointsAdjusted)
          } else {
            peerScoresEach[recipient] = [pointsAdjusted];
          }
        }
      }
    });
    // Normalise the scores to be within [-3, 3].
    studentDataToMerge.checkinScorePeers = averageObjectValues(peerScoresEach);
    studentDataToMerge.checkinScoreSelf = averageObjectValues(selfScoresEach);
    studentDataToMerge.checkinsSubmitted = checkinsSubmitted;
    renderObj.checkinThresholds = { min: -3, low: -1, high: 1, max: 3 };
    renderObj.peerReviewCount = peerReviewCount ?? 0;
  } else {
    renderObj.checkinThresholds = { min: 0, low: 0, high: 0, max: 0, };
    renderObj.peerReviewCount = peerReviewCount ?? 0;
  }
  // Add in observation comments
  const observations = await observationModel
    .find({ team: team._id, createdAt: { $lte: periodEnd, $gte: periodStart, }})
    .populate("observer", "displayName")
    .select("observer comment students createdAt")
    .sort({ createdAt: -1 }).lean();
  if (observations.length > 0) {
    const formattedObservations = observations.map(o => ({...o, createdAt: format(o.createdAt, "dd/MM/yyyy")}));
    renderObj.teamObservations = formattedObservations.filter(o => !o.students || o.students?.length === 0);
    renderObj.individualObservations = formattedObservations.filter(o => o.students && o.students.length > 0);
  }
  // Merge the student data into the main object.
  for (const memberId in renderObj.members) {
    delete renderObj.members[memberId]._id;
    // Iterate through each data type in studentDataToMerge.
    for (const dataType in studentDataToMerge) {
      // If this member has data for this type, add it.
      if (typeof studentDataToMerge[dataType][memberId] !== "undefined") {
        renderObj.members[memberId][dataType] = studentDataToMerge[dataType][memberId];
      }
    }
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
  const searchStartDate = periodStart ? new Date(periodStart) : new Date(2020, 0, 1);
  const searchEndDate = periodEnd ? new Date(periodEnd) : new Date();
  searchEndDate.setHours(23, 59, 59, 999);
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
  const allPeerReviews = await peerReviewModel.find({
    assignment: assignmentInfo._id,
    periodEnd: { $lte: searchEndDate, },
    periodStart: { $gte: searchStartDate, },
  }).sort({ periodStart: -1, }).lean();
  let peerReviewDetails;
  if (peerReviewId) {
    const matchedReview = allPeerReviews.find(p => p._id == peerReviewId);
    if (!matchedReview)
      throw new GenericNotFoundError("That peer review could not be found for this assignment.");
    peerReviewDetails = matchedReview;
  }
  // Now generate the reports for each team
  for (const team of teams) {
    const teamData = await summariseTeamData({
      team, 
      assignment: assignmentInfo, 
      peerReview: peerReviewDetails,
      periodStart: searchStartDate,
      periodEnd: searchEndDate,
      peerReviewCount: allPeerReviews.length
    });
    generatedReportObjects.push(teamData);
  }
  const metadata = { assignmentName: assignmentInfo.name, teamNumbers: teams.map(t => t.teamNumber), };
  return {reports: generatedReportObjects, metadata, };
};

/**
 * Produces exportable HTML-formatted reports about teams. Provide either team
 * or assignment.
 */
exports.generateTeamReports = async (req, res) => {
  await checkTeamRole(req.params.team, req.session.userId, "supervisor/lecturer");
  if (req.query.peerReview && !Types.ObjectId.isValid(req.query.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid."); 
  const { reports, metadata } = await generateDataForTeams({ teamId: req.params.team, peerReviewId: req.query.peerReview, periodStart: req.query.periodStart, periodEnd: req.query.periodEnd, });
  if (req.query.format === "json") {
    return res.json({ ...reports[0], teamNumber: metadata.teamNumbers[0], assignmentName: metadata.assignmentName, });
  }
  if (req.query.attachment) {
    res.attachment(`Progress Report - ${metadata.assignmentName}, Team ${metadata.teamNumbers[0]}.html`);
  }
  return res.render("reports/team", reports[0]);
};

/**
 * Similar to above, but produces a ZIP of HTML reports, one for each team in a
 * given assignment.
 */
exports.generateTeamReportsBulk = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (req.query.peerReview && !Types.ObjectId.isValid(req.query.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid.");
  // Generate data about teams
  const { reports, metadata } = await generateDataForTeams({ assignmentId: req.params.assignment, peerReviewId: req.query.peerReview, periodStart: req.query.periodStart, periodEnd: req.query.periodEnd, });
  if (req.query.format === "json") {
    const reportsCombined = reports.map((report, index) => ({ ...report, teamNumber: metadata.teamNumbers[index]}));
    return res.json({ teams: reportsCombined, });
  }
  // Setup zip response
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="Progress Reports - ${metadata.assignmentName}.zip"`);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);
  for (let i=0; i < reports.length; i++) {
    const html = await ejs.renderFile(path.join(__dirname, "..", "views", "reports", "team.ejs"), reports[i]);
    const htmlBuffer = Buffer.from(html, "utf-8");
    const stream = Readable.from(htmlBuffer);
    archive.append(stream, { name: `Progress Report - ${metadata.assignmentName}, Team ${metadata.teamNumbers[i]}.html` });
  }
  archive.finalize();
};
