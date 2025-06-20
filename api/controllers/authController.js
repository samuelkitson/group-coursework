const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

const { COOKIE_NAME } = require("../config/constants");

const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");

exports.login = async (req, res) => {
  // Look up user in database, and return 401 if email address not found
  const dbRecord = await userModel.findOne(
    { email: req.body.email },
    "_id email passwordHash displayName role",
  );
  if (dbRecord === null)
    return res.status(401).json({ message: "Invalid credentials" });
  // User found, so check their password
  pwCorrect = await bcrypt.compare(req.body.password, dbRecord.passwordHash);
  if (pwCorrect) {
    // Initialise session
    req.session.userId = dbRecord._id;
    req.session.email = dbRecord.email;
    req.session.role = dbRecord.role;
    res.json({
      message: "Logged in successfully",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
      },
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

exports.refreshUserData = async (req, res) => {
  const dbRecord = await userModel.findById(
    req.session.userId,
    "_id email passwordHash displayName role",
  );
  if (dbRecord) {
    return res.json({
      message: "Logged in successfully",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
      },
    });
  } else {
    return res.status(401).json({ message: "Unknown sesssion ID." });
  }
};

exports.logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Could not log out, please try again" });
    }
    res.clearCookie(COOKIE_NAME);
    res.json({ message: "Logged out successfully" });
  });
};

exports.databaseTest = async (req, res) => {
  const dbAssignments = await assignmentModel.find();

  res.json(dbAssignments);
};
