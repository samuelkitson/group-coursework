const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");
const crypto = require("crypto");

const { COOKIE_NAME } = require("../config/constants");

const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");
const { SessionInvalidError, AuthenticationError, ConfigurationError, InvalidParametersError } = require("../errors/errors");
const { default: axios } = require("axios");
const msalConfig = require("../utility/msalConfig");

exports.login = async (req, res) => {
  // Look up user in database, and return 401 if email address not found
  const dbRecord = await userModel.findOne(
    { email: req.body.email },
    "_id email passwordHash displayName role",
  );
  if (dbRecord === null)
    return res.status(401).json({ message: "Your username and password weren't recognised. Please try again." });
  if (!dbRecord.passwordHash)
    throw new AuthenticationError("This account isn't set up for password access. Please sign in with your external account.");
  // User found, so check their password
  pwCorrect = await bcrypt.compare(req.body.password, dbRecord.passwordHash);
  if (pwCorrect) {
    // Initialise session
    req.session.userId = dbRecord._id;
    req.session.email = dbRecord.email;
    req.session.role = dbRecord.role;
    res.json({
      message: "Logged in successfully. Welcome back!",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
      },
    });
  } else {
    res.status(401).json({ message: "Your username and password weren't recognised. Please try again." });
  }
};

exports.refreshUserData = async (req, res) => {
  const dbRecord = await userModel.findById(
    req.session.userId,
    "_id email passwordHash displayName role",
  );
  if (dbRecord) {
    return res.json({
      message: "Logged in successfully. Welcome back!",
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
        .json({ message: "Could not log out, please try again." });
    }
    res.clearCookie(COOKIE_NAME);
    res.json({ message: "Logged out successfully." });
  });
};

exports.getAzureLoginLink = async (req, res) => {
  const { OAUTH_REDIRECT_URI, AZURE_CLIENT_ID, AZURE_TENANT_ID, } = process.env;
  if (!OAUTH_REDIRECT_URI || !AZURE_CLIENT_ID || !AZURE_TENANT_ID || !msalConfig) {
    throw new ConfigurationError("Missing Azure OAuth environment variables", "Login with Microsoft is currently unavailable. Please try again later.");
  }
  const state = crypto.randomUUID();
  req.session.oauthState = state;
  const urlParams = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    response_type: "code",
    redirect_uri: OAUTH_REDIRECT_URI,
    response_mode: "query",
    scope: "openid profile email",
    state,
  });
  const authUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?${urlParams.toString()}`;
  res.json({ authUrl });
};

exports.azureLoginCallback = async (req, res) => {
  const { OAUTH_REDIRECT_URI } = process.env;
  if (!OAUTH_REDIRECT_URI || !msalConfig) {
    throw new ConfigurationError("Missing Azure OAuth environment variables", "Login with Microsoft is currently unavailable. Please try again later.");
  }
  // Check the state token is valid
  const { code, state } = req.body;
  const oAuthState = req.session.oauthState ?? undefined;
  delete req.session.oauthState;
  if (!state || state !== oAuthState)
    throw new AuthenticationError("Invalid OAuth state parameter. Please try again.");
  // Request a token using the provided code
  const tokenRequest = {
    code,
    scopes: ["openid", "profile", "email"],
    redirectUri: OAUTH_REDIRECT_URI,
  };
  const tokenResponse = await msalConfig.acquireTokenByCode(tokenRequest);
  if (!tokenResponse)
    throw new AuthenticationError("Authentication with Microsoft failed. Please try again.");
  // Login successful - now call Microsoft Graph to get data about them
  const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me?$select=userPrincipalName,jobTitle,department,employeeId,givenName,surname", {
    headers: { Authorization: `Bearer ${tokenResponse.accessToken}`, },
  });
  const userData = graphResponse.data;
  if (!userData)
    throw new AuthenticationError("Authentication with Microsoft failed. Please try again.");
  // Extract the relevant user profile fields
  const email = userData.userPrincipalName;
  const isStudent = (userData?.jobTitle ?? "").includes("(student)");
  const department = userData.department;
  const employeeId = userData.employeeId;
  const firstName = userData.givenName;
  const surname = userData.surname;
  const displayName = `${firstName} ${surname}`;
  // Find user in database
  const dbRecord = await userModel.findOne( { email }, "_id email displayName role", );
  if (dbRecord) {
    // Update display name in case this has changed since last login
    if (dbRecord.displayName !== displayName) {
      dbRecord.displayName = displayName;
      await dbRecord.save();
    }
    // Start the session
    req.session.userId = dbRecord._id;
    req.session.email = dbRecord.email;
    req.session.role = dbRecord.role;
    res.json({
      message: "Logged in successfully. Welcome back!",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
      },
    });
  } else {
    // Create a new account for this user
    const createdAccount = await userModel.create({
      displayName,
      email,
      role: isStudent ? "student" : "staff",
    });
    if (!createdAccount)
      throw new AuthenticationError("Something went wrong creating your account. Please try again.");
    req.session.userId = createdAccount._id;
    req.session.email = createdAccount.email;
    req.session.role = createdAccount.role;
    res.json({
      message: "Account created successfully. Welcome!",
      data: {
        userId: createdAccount._id,
        email: createdAccount.email,
        displayName: createdAccount.displayName,
        role: createdAccount.role,
      },
    });
  }
};

/**
 * Used to search for users by email or display name and return their ID (as 
 * well as other details) so that they can be added to a staff list for example.
 */
exports.searchForUser = async (req, res) => {
  // Validate incoming data
  const searchString = req.query.string;
  if (!searchString)
    throw new InvalidParametersError("Provide either an email address or display name to search by.");
  const query = { $or: [
    { email: searchString }, { displayName: searchString },
  ]};
  const matches = await userModel.find(query).select("_id email displayName bio role").lean();
  res.json({ users: matches });
};
