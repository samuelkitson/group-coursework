const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

const { COOKIE_NAME } = require("../config/constants");

const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");
const { SessionInvalidError, AuthenticationError } = require("../errors/errors");
const { default: axios } = require("axios");

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

exports.getGitHubLoginLink = async (req, res) => {
  const state = "supersecurerandomstate";
  req.session.oauthState = state;
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${process.env.GITHUB_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI)}&` +
    `state=${state}&` +
    `scope=user:email`;
  res.json({ authUrl });
};

exports.gitHubLoginCallback = async (req, res) => {
  const { code, state } = req.body;
  if (!state || state !== req.session.oauthState)
    throw new AuthenticationError("Invalid OAuth state parameter. Please try again.");
  delete req.session.oauthState;
  const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: code
  }, {
    headers: { 
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
  const accessToken = tokenResponse.data.access_token;
  if (!accessToken)
    throw new AuthenticationError("No access token received from GitHub. Please try again.");
  const emailResponse = await axios.get("https://api.github.com/user/emails", {
    headers: { "Authorization": `token ${accessToken}` }
  });
  const userEmail = emailResponse.data.find(e => e.primary);
  if (!userEmail)
    throw new AuthenticationError("No primary email could be found for your GitHub account. Please check your account and try again");
  // Find user in database
  const dbRecord = await userModel.findOne( { email: userEmail.email }, "_id email displayName role", );
  if (!dbRecord)
    throw new AuthenticationError(`${userEmail.email} isn't associated with any accounts. Please try a different GitHub account.`);
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
};
