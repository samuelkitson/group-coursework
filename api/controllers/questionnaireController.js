const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const { Types } = require("mongoose");
const { checkAssignmentRole } = require("../utility/auth");
const { InvalidParametersError } = require("../errors/errors");

/*
  For students, get the questionnaire for them to complete for a given
  assignment. Must provide the assignment ID in the query parameters.
*/
exports.getAllocationQuestionnaire = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "student");
  const assignment = await assignmentModel
    .findById(req.query.assignment)
    .lean();
  const user = await userModel.findById(req.session.userId).lean();
  // Get the list of required skills along with existing user ratings
  let skillsWithRatings = [];
  // Skip if there are no required skills for this assignment
  if (assignment?.skills?.length > 0) {
    // Combine together to give existing ratings where available
    skillsWithRatings = assignment.skills.map((s) => {
      const existingRating = user?.skills?.[s.name] || null;
      return {
        ...s,
        rating: existingRating,
      };
    });
  }
  return res.json(skillsWithRatings);
};

exports.updateUserSkills = async (req, res) => {
  const updatedSkills = req.body.skills;
  if (!updatedSkills || typeof updatedSkills !== "object")
    throw new InvalidParametersError("Invalid skills update. Please try again.")
  // Get the user's object from the DB
  const user = await userModel.findById(req.session.userId);
  if (!user.skills) user.skills = {};
  // Iterate through the updates skills list and update the user's object accordingly
  for (const [key, value] of Object.entries(updatedSkills)) {
    if (typeof value === "number") {
      user.skills.set(key, value);
    }
  }
  await user.save();
  return res.json({ message: "Your skills assessment has been saved." });
};

exports.allExistingSkills = async (req, res) => {
  const skills = await assignmentModel.allExistingSkills();
  return res.json(skills);
};
