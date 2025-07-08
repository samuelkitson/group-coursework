const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");
const { BCRYPT_ROUNDS } = require("../config/constants");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const { AssignmentNotFoundError, IncorrectRoleError, SessionInvalidError, ConfigurationError, InvalidObjectIdError } = require("../errors/errors");

// Middleware to check if user is authenticated
// If the permitted role is "staff" it will also allow admins access
exports.requireLoggedIn = (permittedRole = null) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      throw new SessionInvalidError();
    } else if (permittedRole === "staff" && req.session.role === "admin") {
      next();
    } else if (permittedRole && req.session.role != permittedRole) {
      throw new IncorrectRoleError();
    } else {
      next();
    }
  };
};

/**
 * Authorisation handler to check whether the current logged-in user has a
 * certain role on a given assignment (or any role, by omitting the role
 * parameter).
 * @param {ObjectId} assignmentId the assignment ID.
 * @param {ObjectId} userId the user's ID.
 * @param {string|null} accessLevel the roles to check (forward slash delimited)
 * or null if any is allowed.
 */
exports.checkAssignmentRole = async (assignmentId, userId, accessLevel = null) => {
  // Check whether the assignment ID is a valid ObjectId.
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new AssignmentNotFoundError("The provided assignment ID is invalid.");
  }
  // Check whether the user ID is a valid ObjectId.
  if (!Types.ObjectId.isValid(userId)) {
    throw new SessionInvalidError();
  }
  // If applicable, check whether the user is a student on the assignment.
  if (accessLevel.includes("student")) {
    if (await assignmentModel.isUserOnAssignment(assignmentId, userId, "student")) return "student";
  }
  // If applicable, check whether the user is a lecturer on the assignment.
  if (accessLevel.includes("lecturer")) {
    if (await assignmentModel.isUserOnAssignment(assignmentId, userId, "lecturer")) return "lecturer";
  }
  // If applicable, check whether the user is a supervisor on the assignment.
  if (accessLevel.includes("supervisor")) {
    if (await assignmentModel.isUserOnAssignment(assignmentId, userId, "supervisor")) return "supervisor";
  }
  throw new AssignmentNotFoundError();
};

/**
 * 
 * @param {ObjectId} teamId the ID of the team.
 * @param {ObjectId} userId the user's ID.
 * @param {string} accessLevel "member" if the user must be a student team
 * member, "supervisor" if the user must be a team supervisor,
 * "member/supervisor" if they must be a member or supervisor,
 * "supervisor/lecturer" if they must be a team supervisor or assignment staff,
 * "lecturer" if they must be staff on the assignment,
 * "member/supervisor/lecturer" if any of the above
 */
exports.checkTeamRole = async (teamId, userId, accessLevel = "member") => {
  // Check whether the team ID is a valid ObjectId.
  if (!Types.ObjectId.isValid(teamId)) {
    throw new InvalidObjectIdError("The provided team ID is invalid.");
  }
  // Check whether the user ID is a valid ObjectId.
  if (!Types.ObjectId.isValid(userId)) {
    throw new SessionInvalidError();
  }
  // If applicable, check whether the user is a team member.
  if (accessLevel.includes("member")) {
    if (await teamModel.isUserOnTeam(teamId, userId)) return "member";
  }
  // If applicable, check whether the user is a team supervisor.
  if (accessLevel.includes("supervisor")) {
    if (await teamModel.isSupervisorOnTeam(teamId, userId)) return "supervisor";
  }
  // If applicable, check whether the user is an assignment lecturer.
  if (accessLevel.includes("lecturer")) {
    const teamDetails = await teamModel.findById(teamId).select("assignment").lean();
    if (teamDetails?.assignment) {
      if (await assignmentModel.isUserOnAssignment(teamDetails.assignment, userId, "lecturer")) return "lecturer";
    }
  }
  // None of the checks passed.
  throw new IncorrectRoleError(`You need to be a ${accessLevel} of this team to perform that action.`);
};

// Generate a hash from a given password
exports.generateHash = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};
