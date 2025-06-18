const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const { Types } = require("mongoose");

/*
  For a given assignment, return a breakdown of the skills ratings for each
  required skill.
*/
exports.skillsBreakdown = async (req, res) => {
  if (!Types.ObjectId.isValid(req.query.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.query.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
  // Fetch data about assignment, skills and students
  const assignment = await assignmentModel
    .findById(req.query.assignment)
    .lean();
  if (!assignment)
    return res.status(404).json({ message: "Assignment not found." });
  const requiredSkills = assignment.skills;
  if (!requiredSkills || requiredSkills.length == 0)
    return res
      .status(404)
      .json({ message: "You must set up some required skills first." });
  const studentIds = assignment.students.map((s) => new Types.ObjectId(s));
  const students = await userModel
    .find({ _id: { $in: studentIds } })
    .select("skills")
    .lean();
  // Calculate skill rating frequencies
  const skillFrequencies = {};
  requiredSkills.forEach((skillObj) => {
    const ratings = students
      .map((s) => s.skills?.[skillObj.name])
      .filter(Number);
    const ratingFreq = [];
    for (let i = 1; i <= 7; i++) {
      ratingFreq.push(ratings.filter((x) => x == i).length);
    }
    skillFrequencies[skillObj.name] = ratingFreq;
  });
  return res.json({
    skills: skillFrequencies,
    studentCount: studentIds.length,
  });
};

exports.teamSkillsBreakdown = async (req, res) => {
  if (!Types.ObjectId.isValid(req.query.team))
      return res.status(400).json({ message: "Invalid team ID." });
  const team = await teamModel.findById(req.query.team).populate("members", "skills").lean();
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
  } else {
    if (!team) return res.status(404).json({ message: "The team was not found.", });
  }
  // Get the required skills for this module
  const assignment = await assignmentModel.findById(team.assignment).select("skills").lean();
  const user = team?.members.find(s => s._id.equals(req.session.userId));
  if (!assignment) return res.status(404).json({ message: "The assignment was not found.", });
  // Get the team skills
  const skillScores = [];
  for (const reqSkill of (assignment?.skills ?? [])) {
    const skillObj = { skill: reqSkill.name };
    skillObj["team"] = team.members.reduce((maxScore, member) => {
      if (member.skills) {
        return member.skills?.[reqSkill.name] > maxScore ? member.skills?.[reqSkill.name] : maxScore
      } else {
        return maxScore
      }
    }, 0);
    skillObj["user"] = user?.skills?.[reqSkill.name] ?? 0;
    skillScores.push(skillObj);
  }
  return res.json({ skills: skillScores });
};

exports.teamMeetingsBreakdown = async (req, res) => {
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
  } else {
    if (!team) return res.status(404).json({ message: "The team was not found.", });
  }
  // Get the teams for this assignment
  const teamMeetings = await meetingModel.find({ team: new Types.ObjectId(req.query.team) })
    .sort({ dateTime: -1 })
    .lean();

  const meetingsCount = teamMeetings.length ?? 0;
  const lastMeetingDate = teamMeetings[0] ? teamMeetings[0].dateTime : null;
  const outstandingActionsCount = teamMeetings[0]?.newActions?.length ?? 0;

  return res.json({ meetingsCount, lastMeetingDate, outstandingActionsCount, });
};
