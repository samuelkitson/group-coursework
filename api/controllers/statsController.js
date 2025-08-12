const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const { Types } = require("mongoose");
const { checkTeamRole, checkAssignmentRole } = require("../utility/auth");
const { setDifference } = require("../utility/maths");
const { GenericNotFoundError } = require("../errors/errors");

/*
  For a given assignment, return a breakdown of the skills ratings for each
  required skill.
*/
exports.skillsBreakdown = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  // Fetch data about assignment, skills and students
  const assignment = await assignmentModel
    .findById(req.query.assignment)
    .lean();
  const requiredSkills = assignment.skills;
  if (!requiredSkills || requiredSkills.length == 0)
    throw new GenericNotFoundError("You need to set up some required skills for this assignment first.")
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
  await checkTeamRole(req.query.team, req.session.userId, "member/supervisor/lecturer");
  const team = await teamModel.findById(req.query.team).populate("members", "skills").lean();
  // Get the required skills for this module
  const assignment = await assignmentModel.findById(team.assignment).select("skills").lean();
  const user = team?.members.find(s => s._id.equals(req.session.userId));
  if (!assignment)
    return GenericNotFoundError("The assignment couldn't be found. Try logging out and back in again.");
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

exports.questionnaireEngagement = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  // Fetch data about assignment, skills and students
  const assignment = await assignmentModel
    .findById(req.query.assignment)
    .populate("students", "skills")
    .lean();
  const requiredSkills = new Set(assignment.skills.map(s => s.name));
  if (!requiredSkills || requiredSkills.size == 0)
    throw new GenericNotFoundError("You need to set up some required skills for this assignment first.")
  let questionnairesComplete = 0;
  for (const student of assignment.students) {
    const studentSkills = new Set(Object.keys(student?.skills ?? {}));
    const missingSkills = setDifference(requiredSkills, studentSkills);
    if (missingSkills.size == 0) questionnairesComplete += 1;
  }
  return res.json({
    complete: questionnairesComplete,
    incomplete: assignment.students.length - questionnairesComplete,
    total: assignment.students.length,
  });
};

exports.teamMeetingsBreakdown = async (req, res) => {
  await checkTeamRole(req.query.team, req.session.userId, "member/supervisor/lecturer");
  // Get the teams for this assignment
  const teamMeetings = await meetingModel.find({ team: new Types.ObjectId(req.query.team) })
    .sort({ dateTime: -1 })
    .lean();

  const meetingsCount = teamMeetings.length ?? 0;
  const lastMeetingDate = teamMeetings[0] ? teamMeetings[0].dateTime : null;
  const outstandingActionsCount = teamMeetings[0]?.newActions?.length ?? 0;

  return res.json({ meetingsCount, lastMeetingDate, outstandingActionsCount, });
};
