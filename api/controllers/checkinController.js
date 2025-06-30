const { Types } = require("mongoose");
const checkinModel = require("../models/checkin");
const teamModel = require("../models/team");
const peerReviewModel = require("../models/peerReview");
const { checkinStatistics } = require("../utility/maths");
const { checkTeamRole } = require("../utility/auth");
const { InvalidParametersError, GenericNotFoundError, AssignmentInvalidStateError } = require("../errors/errors");

exports.getCheckinStateStudent = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "member");
  // Get the current peer review state from the peer review collection
  const teamInfo = await teamModel.findById(req.query.team).select("members assignment").lean();
  const peerReview = await peerReviewModel.findByAssignment(teamInfo.assignment);
  if (!peerReview) {
    return res.json({ type: "disabled", open: false, });
  }
  if (peerReview.type === "none") {
    return res.json({ type: "none", open: false, });
  }
  // Check for active check-in, or create one if it doesn't exit
  let activeCheckIn = await checkinModel.findByTeamAndPeerReview(req.query.team, peerReview._id);
  if (activeCheckIn == null) {
    activeCheckIn = await checkinModel.createNewCheckin(req.query.team, peerReview._id);
  }
  const alreadyCompleted = activeCheckIn.effortPoints?.hasOwnProperty(req.session.userId) ?? false;
  const membersCount = teamInfo.members.length;
  const ratedCount = Object.keys(activeCheckIn.effortPoints).length;
  return res.json({
    type: peerReview.type,
    open: !alreadyCompleted,
    completionRate: { done: ratedCount, outOf: membersCount }
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
  // Check for active check-in
  let activeCheckIn = await checkinModel.findByTeamAndPeerReview(req.body.team, peerReview._id);
  if (activeCheckIn == null)
    // This can happen if the lecturer has edited the current peer review in
    // such a way that its ObjectID changed.
    throw new AssignmentInvalidStateError("Something went wrong processing your response. Please copy your responses somewhere safe, then refresh and try again.");
  if (activeCheckIn.effortPoints == null) activeCheckIn.effortPoints = {};
  const alreadyCompleted = activeCheckIn.effortPoints?.hasOwnProperty(req.session.userId) ?? false;
  if (alreadyCompleted)
    throw new InvalidParametersError("You've already completed this week's check-in.");
  // Check that everyone has been accounted for in the effort points
  const teamMembers = teamInfo.members.map(id => id.toString());
  const membersRated = Object.keys(effortPoints).map(id => id.toString());
  if (membersRated.length != teamMembers.length || !membersRated.every(id => teamMembers.includes(id)))
    throw new InvalidParametersError("You need to allocate some effort points to each team member.");
  // Check whether the points are balanced and add up correctly
  const totalPoints = effortPoints.length * 7;
  let pointsSum = 0;
  Object.values(effortPoints).forEach(points => {
    if (points < 1 || points > 7)
      throw new InvalidParametersError("Effort points can only be between 1 and 7 inclusive.")
    pointsSum += points;
  });
  if (!totalPoints === pointsSum)
    throw new InvalidParametersError("The effort points you have submitted are not balanced evenly.")
  // All ok, update the record
  activeCheckIn["effortPoints"][req.session.userId] = effortPoints;
  activeCheckIn.markModified("effortPoints");
  await activeCheckIn.save();
  return res.json({ message: "Your weekly check-in has been submitted. Thank you!"});
};

exports.getCheckInHistory = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "supervisor/lecturer");
  // As a helper, also get the user ID => display name mapping
  const team = await teamModel
    .findById(req.query.team)
    .populate("members", "displayName")
    .select("members")
    .lean();
  const idsToNames = team.members.reduce((acc, member) => {
    acc[member._id] = member.displayName;
    return acc;
  }, {});
  // Get the checkins for this team
  const checkins = await checkinModel.find({
    team: new Types.ObjectId(req.query.team),
    })
    .populate({
      path: "peerReview",
      match: { periodEnd: { $lt: new Date() } },
      select: "periodStart periodEnd type questions",
    })
    .sort({ "peerReview.periodStart": 1 }).lean();
  // Filter to remove any where the peerReview object has been lost
  const filteredCheckins = checkins.filter(checkin => checkin.peerReview !== null);
  const checkinStats = filteredCheckins.map(c => {
    const stats = checkinStatistics(c.effortPoints);
    return { periodStart: c.peerReview.periodStart, periodEnd: c.peerReview.periodEnd, ...stats, };
  }).filter(c => c?.netScores && c?.totalScores);
  // Change the user IDs to display names for simplicity
  const statsWithNames = checkinStats.map(c => ({
    ...c,
    netScores: Object.keys(c.netScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.netScores[id] }), {}),
    totalScores: Object.keys(c.totalScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.totalScores[id] }), {}),
  }));
  return res.json({ checkins: statsWithNames, });
};
