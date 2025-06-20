const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");
const { BCRYPT_ROUNDS } = require("../config/constants");
const assignmentModel = require("../models/assignment");
const { AssignmentNotFoundError } = require("../errors/errors");

// Middleware to check if user is authenticated
exports.requireLoggedIn = (permittedRole = null) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({
        code: "SESSION-INVALID",
        message: "You need to be logged in to do that.",
      });
    } else if (permittedRole && req.session.role != permittedRole) {
      return res.status(403).json({
        code: "INCORRECT-ROLE",
        message: `You must be a ${permittedRole} to do that.`,
        userRole: req.session.role,
        requiredRole: permittedRole,
      });
    } else {
      next();
    }
  };
};

/**
 * Authorisation handler to check whether the current logged-in user has a
 * certain role on a given assignment (or any role, by omitting the role
 * parameter).
 * @param {ObjectId} assignmentIdLocation "params-assignment", "params-id",
 * "body-assignment" or "body-id".
 * @param {ObjectId} userId the user's ID.
 * @param {string|null} role the role to check or null if any is allowed.
 */
exports.checkAssignmentRole = async (assignmentId, userId, role = null) => {
  // Check whether the assignment ID is a valid ObjectId.
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new AssignmentNotFoundError("The provided assignment ID is invalid.");
  }
  // Now check whether the user is on the given assignment.
  const valid = await assignmentModel.isUserOnAssignment(assignmentId, userId, role);
  if (!valid) {
    // Assignment is either not known, or the user has the wrong role.
    throw new AssignmentNotFoundError();
  }
};

// Generate a hash from a given password
exports.generateHash = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};
