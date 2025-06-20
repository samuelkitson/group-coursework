const bcrypt = require("bcryptjs");
const { BCRYPT_ROUNDS } = require("../config/constants");

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

// Generate a hash from a given password
exports.generateHash = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};
