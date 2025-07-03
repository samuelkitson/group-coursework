const { Types } = require("mongoose");
const checkinModel = require("../models/checkin");
const teamModel = require("../models/team");
const peerReviewModel = require("../models/peerReview");
const { checkinStatistics } = require("../utility/maths");
const { checkTeamRole } = require("../utility/auth");
const { InvalidParametersError, GenericNotFoundError, AssignmentInvalidStateError, ConfigurationError } = require("../errors/errors");

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
    peerReview: peerReview._id,
    team: req.query.team,
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
    reviewer: req.session.userId,
    peerReview: peerReview._id,
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
  // As a helper, also get the user ID => display name mapping
  const team = await teamModel
    .findById(req.query.team)
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
    team: new Types.ObjectId(req.query.team),
  }).select("reviewer peerReview effortPoints").lean();
  const peerReviewPoints = await peerReviewModel.find({
    assignment: team.assignment,
    periodEnd: { $lt: new Date() },
  }).sort({ "periodStart": 1 }).lean();

  const checkinsGrouped = peerReviewPoints.map(p => {
    const relevantCheckins = checkins.filter(c => p._id.equals(c.peerReview)) ?? [];
    const {netScores, totalScores} = checkinStatistics(relevantCheckins);
    return {...p, checkins: relevantCheckins, netScores, totalScores};
  });

  const simplifiedStats = checkinsGrouped.map(c => ({
    periodStart: c.periodStart,
    periodEnd: c.periodEnd,
    type: c.type,
    netScores: Object.keys(c.netScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.netScores[id] }), {}),
    totalScores: Object.keys(c.totalScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.totalScores[id] }), {}),
  }));

  return res.json({ checkins: simplifiedStats, });
};
