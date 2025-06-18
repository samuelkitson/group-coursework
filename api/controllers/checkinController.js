const { Types } = require("mongoose");
const checkinModel = require("../models/checkin");
const teamModel = require("../models/team");
const { checkinStatistics } = require("../utility/maths");

exports.getCheckinStateStudent = async (req, res) => {
  // Check if the user is on the given team
  if (!Types.ObjectId.isValid(req.query.team))
    return res.status(400).json({ message: "Invalid team ID." });
  if (
    !(await teamModel.isUserOnTeam(
      req.query.team,
      req.session.userId,
    ))
  ) {
    return res.status(404).json({
      message:
        "The team is unknown or you are not registered as a student on it.",
    });
  }
  // Check for active check-in, or create one if it doesn't exit
  let activeCheckIn = await checkinModel.findActiveForTeam(req.query.team);
  if (activeCheckIn == null) {
    activeCheckIn = await checkinModel.createNewCheckin(req.query.team);
  }
  const alreadyCompleted = activeCheckIn.effortPoints?.hasOwnProperty(req.session.userId) ?? false;
  const teamInfo = await teamModel.findById(req.query.team).select("members").lean();
  const membersCount = teamInfo.members.length;
  const ratedCount = Object.keys(activeCheckIn.effortPoints).length;
  return res.json({ open: !alreadyCompleted, completionRate: { done: ratedCount, outOf: membersCount } });
};

exports.submitCheckIn = async (req, res) => {
  // Check if the user is on the given team
  if (!Types.ObjectId.isValid(req.body.team))
    return res.status(400).json({ message: "Invalid team ID." });
  if (
    !(await teamModel.isUserOnTeam(
      req.body.team,
      req.session.userId,
    ))
  ) {
    return res.status(404).json({
      message:
        "The team is unknown or you are not registered as a student on it.",
    });
  }
  const effortPoints = req.body.effortPoints;
  if (!effortPoints || typeof effortPoints !== "object")
    return res.status(400).json({ message: "Invalid effort points allocation." });
  // Check for active check-in, or create one if it doesn't exit
  let activeCheckIn = await checkinModel.findActiveForTeam(req.body.team);
  if (activeCheckIn == null) {
    activeCheckIn = await checkinModel.createNewCheckin(req.body.team);
  }
  if (activeCheckIn.effortPoints == null) activeCheckIn.effortPoints = {};
  const alreadyCompleted = activeCheckIn.effortPoints?.hasOwnProperty(req.session.userId) ?? false;
  if (alreadyCompleted) {
    return res.status(400).json({message: "You've already completed this week's check-in."});
  }
  // Check that everyone has been accounted for in the effort points
  const teamInfo = await teamModel.findById(req.body.team).select("members").lean();
  const teamMembers = teamInfo.members.map(id => id.toString());
  const membersRated = Object.keys(effortPoints).map(id => id.toString());
  if (membersRated.length != teamMembers.length || !membersRated.every(id => teamMembers.includes(id))) {
    return res.status(400).json({ message: "You need to allocate some effort points to each team member." });
  }
  // Check whether the points are balanced and add up correctly
  const totalPoints = effortPoints.length * 7;
  let pointsSum = 0;
  Object.values(effortPoints).forEach(points => {
    if (points < 1 || points > 7) {
      return res.status(400).json({ message: "Effort points invalid." });
    }
    pointsSum += points;
  });
  if (!totalPoints === pointsSum) {
    return res.status(400).json({ message: "The effort points you have allocated are not balanced properly." });
  }
  // All ok, update the record
  activeCheckIn["effortPoints"][req.session.userId] = effortPoints;
  activeCheckIn.markModified("effortPoints");
  await activeCheckIn.save();
  return res.json({ message: "Your weekly check-in has been submitted. Thank you!"});
};

exports.getCheckInHistory = async (req, res) => {
  if (!Types.ObjectId.isValid(req.query.team))
    return res.status(400).json({ message: "Invalid team ID." });
  if (req.session.role === "student") {
    if (
      !(await teamModel.isUserOnTeam(
        req.query.team,
        req.session.userId,
      ))
    ) {
      return res.status(404).json({
        message:
          "The team is unknown or you are not registered as a student on it.",
      });
    }
  }
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
  const checkins = await checkinModel.find({ team: new Types.ObjectId(req.query.team), periodEnd: { $lt: new Date() }, }).sort({ periodStart: 1 });
  const checkinStats = checkins.map(c => {
    const stats = checkinStatistics(c.effortPoints);
    return { periodStart: c.periodStart, periodEnd: c.periodEnd, ...stats, };
  }).filter(c => c?.netScores && c?.totalScores);
  // Change the user IDs to display names for simplicity
  const statsWithNames = checkinStats.map(c => ({
    ...c,
    netScores: Object.keys(c.netScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.netScores[id] }), {}),
    totalScores: Object.keys(c.totalScores).reduce((acc, id) => ({ ...acc, [idsToNames[id] || id]: c.totalScores[id] }), {}),
  }));
  return res.json({ checkins: statsWithNames, });
};
