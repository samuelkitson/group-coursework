const { Types } = require("mongoose");
const checkinModel = require("../models/checkin");
const teamModel = require("../models/team");
const peerReviewModel = require("../models/peerReview");
const { checkinStatistics, peerReviewSkillsStatistics } = require("../utility/maths");
const { checkTeamRole } = require("../utility/auth");
const { InvalidParametersError, GenericNotFoundError, AssignmentInvalidStateError, ConfigurationError, InvalidObjectIdError } = require("../errors/errors");
const checkin = require("../models/checkin");
const { CHECKIN_THRESHOLDS } = require("../config/constants");

exports.checkInHistoryHelper = async (teamId) => {
  // As a helper, also get the user ID => display name mapping
  const team = await teamModel
    .findById(teamId)
    .populate("members", "displayName")
    .select("assignment members")
    .lean();
  const idsToNames = team.members.reduce((acc, member) => {
    acc[member._id] = member.displayName;
    return acc;
  }, {});

  // Get all of the relevant check-ins, and group them together by the peer
  // review points
  const checkins = await checkinModel.find({
    team: new Types.ObjectId(teamId),
  }).select("reviewer peerReview effortPoints").lean();
  const peerReviewPoints = await peerReviewModel.find({
    assignment: team.assignment,
    periodEnd: { $lt: new Date() },
  }).sort({ "periodStart": 1 }).lean();

  // For each peer review point, get the relevant check-ins from the team
  // members and calculate the net and total scores
  const checkinsGrouped = peerReviewPoints.map(p => {
    const relevantCheckins = checkins.filter(c => p._id.equals(c.peerReview)) ?? [];
    const {netScores, normScores, submitted} = checkinStatistics(relevantCheckins);
    return {...p, checkins: relevantCheckins, netScores, normScores};
  });

  // Replace user IDs with names, and remove other unnecessary data
  const simplifiedStats = checkinsGrouped.map(c => ({
    periodStart: c.periodStart,
    periodEnd: c.periodEnd,
    type: c.type,
    netScores: Object.keys(c.netScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.netScores[id] }), {}),
    normScores: Object.keys(c.normScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.normScores[id] }), {}),
  }));

  return simplifiedStats;
};

exports.getCheckinStateStudent = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "member");
  // Get the current peer review state from the peer review collection
  const teamInfo = await teamModel.findById(req.query.team).populate("members", "displayName").select("members assignment").lean();
  const peerReview = await peerReviewModel.findByAssignment(teamInfo.assignment);
  if (!peerReview) {
    return res.json({ type: "disabled", open: false, });
  }
  if (peerReview.type === "none") {
    return res.json({ type: "none", open: false, });
  }
  // Check existing check-ins for this team for the current period
  const existing = (await checkinModel.find({
    team: req.query.team,
    peerReview: peerReview._id,
  }).lean()) ?? [];
  const reviewersSubmitted = existing.map(c => c.reviewer);
  const alreadyCompleted = reviewersSubmitted.some(r => r.equals(req.session.userId));
  // Some of the reviewers who have already submitted may be supervisors, so
  // filter them out
  const teamMembersSubmitted = reviewersSubmitted.filter(r => teamInfo.members.some(m => m._id.equals(r)));
  const membersCount = teamInfo.members.length;
  const questions = peerReview.type === "full" ? peerReview.questions ?? [] : undefined;
  const teamMembers = peerReview.type === "full" ? teamInfo.members.filter(m => !m._id.equals(req.session.userId)) : undefined;
  // Get the details of their team members
  return res.json({
    type: peerReview.type,
    name: peerReview.name,
    open: !alreadyCompleted,
    completionRate: { done: teamMembersSubmitted.length, outOf: membersCount },
    questions,
    teamMembers,
  });
};

exports.submitCheckIn = async (req, res) => {
  await checkTeamRole(req.body.team, req.session.userId, "member");
  // Check whether a peer review is active for this week
  const teamInfo = await teamModel.findById(req.body.team).select("members assignment").lean();
  const peerReview = await peerReviewModel.findByAssignment(teamInfo.assignment);
  if (!peerReview || peerReview.type === "none")
    throw new AssignmentInvalidStateError("No check-in is required for this week.");
  const effortPoints = req.body.effortPoints;
  if (!effortPoints || typeof effortPoints !== "object")
    throw new InvalidParametersError("Invalid effort points allocation.");
  // Make sure that the user hasn't already submitted
  const existing = await checkinModel.findOne({
    team: req.body.team,
    peerReview: peerReview._id,
    reviewer: req.session.userId,
  });
  if (existing)
    throw new InvalidParametersError("You've already completed this week's check-in.");
  // Check that everyone has been accounted for in the effort points
  const teamMembers = teamInfo.members.map(id => id.toString());
  const membersOthers = teamMembers.filter(m => m !== req.session.userId.toString());
  const membersRated = Object.keys(effortPoints).map(id => id.toString());
  if (membersRated.length != teamMembers.length || !membersRated.every(id => teamMembers.includes(id)))
    throw new InvalidParametersError("You need to allocate some effort points to each team member.");
  // Check whether the points are balanced and add up correctly
  const totalPoints = teamMembers.length * 4;
  let pointsSum = 0;
  Object.values(effortPoints).forEach(points => {
    if (points < 1 || points > 7)
      throw new InvalidParametersError("Effort points can only be between 1 and 7 inclusive.")
    pointsSum += points;
  });
  if (totalPoints !== pointsSum)
    throw new InvalidParametersError("The effort points you have submitted are not balanced evenly.")
  const newCheckin = {
    reviewer: req.session.userId,
    team: req.body.team,
    peerReview: peerReview._id,
    effortPoints: effortPoints,
  };
  // If this is a full peer review, check that we have all the fields
  if (peerReview.type === "full") {
    const questions = peerReview.questions ?? [];
    if (!req.body.reviews)
      throw new InvalidParametersError("You need to complete a full peer review this week.");
    if (!Object.keys(req.body.reviews).length === membersOthers.length)
      throw new InvalidParametersError("Please submit a full peer review for each team member.");
    for (const [recipient, review] of Object.entries(req.body.reviews)) {
      if (!membersOthers.includes(recipient))
        throw new InvalidParametersError("You can only submit peer reviews for your own team members.");
      if (!review.comment || review.comment.length < 50)
        throw new InvalidParametersError("Please submit a suitable review comment for each team member.");
      if (questions.length > 0) {
        if (questions.length !== Object.keys(review?.skills ?? {}).length)
          throw new InvalidParametersError("Please complete every skill rating for each team member.");
      }
      for (const [skillName, score] of Object.entries(review?.skills ?? {})) {
        if (!questions.includes(skillName))
          throw new InvalidParametersError(`"${skillName}" is not an allowed rating skill.`);
        if (!(score >= 1 && score <= 5))
          throw new InvalidParametersError("Please select a star rating from 1 to 5 for each skill area.");
      };
    };
    // Checks passed
    newCheckin.reviews = req.body.reviews;
  }
  await checkinModel.create(newCheckin);
  return res.json({ message: "Your weekly check-in has been submitted. Thank you!"});
};

exports.getCheckInHistory = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "supervisor/lecturer");
  const checkins = await this.checkInHistoryHelper(req.query.team);
  return res.json({ checkins, thresholds: CHECKIN_THRESHOLDS, });
};

// Fetch by peer review point and team.
exports.getCheckInResponse = async (req, res) => {
  if (!Types.ObjectId.isValid(req.query.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid.");
  if (!Types.ObjectId.isValid(req.query.team))
    throw new InvalidObjectIdError("The provided team ID is invalid.");
  await checkTeamRole(req.query.team, req.session.userId, "supervisor/lecturer");
  // Get team and check-in data
  // TODO: also get users who have since left the team
  const team = await teamModel
    .findById(req.query.team)
    .populate("members", "displayName")
    .select("assignment members")
    .lean();
  const idsToNames = team.members.reduce((acc, member) => {
    acc[member._id] = member.displayName;
    return acc;
  }, {});
  const checkIns = await checkinModel.find({
    team: req.query.team,
    peerReview: req.query.peerReview,
  }).select("_id reviewer effortPoints reviews").lean();
  // Generate the summaries
  const {normScores, totalScores} = checkinStatistics(checkIns);
  const skillsRatingsSummary = peerReviewSkillsStatistics(checkIns);
  const reviewComments = [];
  // Add names in and gather review comments together
  const checkInsNames = checkIns.map(c => {
    const reviewer = idsToNames[c.reviewer];
    const effortPoints = Object.keys(c.effortPoints).reduce((acc, recipient) => {
      acc[idsToNames[recipient] ?? "Unknown student"] = c.effortPoints[recipient];
      return acc;
    }, {});
    if (c.reviews) reviewComments.push(...Object.keys(c.reviews).map(forId => ({
      fromId: c.reviewer,
      fromName: reviewer,
      forId,
      forName: idsToNames[forId] ?? "Unknown student",
      comment: c.reviews[forId].comment,
      originalComment: c.reviews[forId]?.originalComment,
    })));
    return { _id: c._id, reviewer, effortPoints, };
  });
  const normScoresNames = Object.keys(normScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: normScores[id] }), {});
  const totalScoresNames = Object.keys(totalScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: totalScores[id] }), {});
  const skillRatingsNames = Object.keys(skillsRatingsSummary).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: skillsRatingsSummary[id] }), {});
  if (checkIns.length === 0)
    throw new GenericNotFoundError("No peer review data could be found for those search parameters.");
  if (reviewComments.length === 0) {
    return res.json({ checkIns: checkInsNames, normScores: normScoresNames, totalScores: totalScoresNames, thresholds: CHECKIN_THRESHOLDS, });
  } else {
    return res.json({ skillRatings: skillRatingsNames, reviewComments, checkIns: checkInsNames, normScores: normScoresNames, totalScores: totalScoresNames, thresholds: CHECKIN_THRESHOLDS, });
  }
};

exports.moderateResponse = async (req, res) => {
  if (!Types.ObjectId.isValid(req.body.peerReview))
    throw new InvalidObjectIdError("The provided peer review ID is invalid.");
  if (!Types.ObjectId.isValid(req.body.team))
    throw new InvalidObjectIdError("The provided team ID is invalid.");
  if (!Types.ObjectId.isValid(req.body.reviewer))
    throw new InvalidObjectIdError("The provided reviewer ID is invalid.");
  if (!Types.ObjectId.isValid(req.body.recipient))
    throw new InvalidObjectIdError("The provided recipient ID is invalid.");
  const moderatedComment = req.body.moderatedComment ?? undefined;
  await checkTeamRole(req.body.team, req.session.userId, "supervisor/lecturer");
  // Find the check-in
  const checkIn = await checkinModel.findOne({
    team: req.body.team,
    peerReview: req.body.peerReview,
    reviewer: req.body.reviewer,
  });
  if (!checkIn)
    throw new GenericNotFoundError("Unable to find the specified check-in submission.");
  // Make sure it's a full check-in, and that the given recipient appears
  if (!checkIn.reviews)
    throw new InvalidParametersError("This is a simple check-in, and has no review comments to edit.")
  let edited = false;
  Object.keys(checkIn.reviews).forEach(r => {
    if (r === req.body.recipient) {
      edited = true;
      console.log(checkIn.reviews[r].originalComment == moderatedComment);
      if (!checkIn.reviews[r].originalComment) {
        // First time comment has been edited
        checkIn.reviews[r].originalComment = checkIn.reviews[r].comment;
        checkIn.reviews[r].comment = moderatedComment;
      } else {
        if (checkIn.reviews[r].originalComment == moderatedComment) {
          // Resetting back to unmoderated state
          delete checkIn.reviews[r].originalComment;
          checkIn.reviews[r].comment = moderatedComment;
        } else {
          // Comment has been edited before
          checkIn.reviews[r].comment = moderatedComment;
        }
      }
    }
  });
  if (!edited)
    throw new GenericNotFoundError("The review comment for that user couldn't be found.");
  checkIn.markModified("reviews");
  await checkIn.save();
  return res.json({ message: "Review comment moderated successfully. "});
};
