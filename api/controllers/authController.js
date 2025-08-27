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
    throw new AuthenticationError("Email address not found. Please try again.");
  if (!dbRecord.passwordHash)
    throw new AuthenticationError("Account not set up for password access. Please sign in with Microsoft instead.");
  // User found, so check their password
  pwCorrect = await bcrypt.compare(req.body.password, dbRecord.passwordHash);
  // If the user account status is "placeholder", they need to log in via Entra
  if (dbRecord.role === "placeholder")
    throw new AuthenticationError("Your account isn't fully set up. Please log in via Microsoft first.")
  if (pwCorrect) {
    // Initialise session
    req.session.userId = dbRecord._id;
    req.session.email = dbRecord.email;
    req.session.role = dbRecord.role;
    const canCreateAssignments = process.env?.ASSIGNMENTS_ADMIN_LOCK === "true" ? dbRecord.role === "admin" : ["staff", "admin"].includes(dbRecord.role); 
    res.json({
      message: "Logged in successfully. Welcome back!",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
        canCreateAssignments,
      },
    });
  } else {
    throw new AuthenticationError("Sorry, that password was wrong. Please try again.");
  }
};

exports.refreshUserData = async (req, res) => {
  const dbRecord = await userModel.findById(
    req.session.userId,
    "_id email passwordHash displayName role",
  );
  if (dbRecord) {
    const canCreateAssignments = process.env?.ASSIGNMENTS_ADMIN_LOCK === "true" ? dbRecord.role === "admin" : ["staff", "admin"].includes(dbRecord.role); 
    return res.json({
      message: "Logged in successfully. Welcome back!",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
        canCreateAssignments,
      },
    });
  } else {
    throw new SessionInvalidError();
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

/**
 * This callback performs some UoS/ECS specific logic, and should be adjusted if
 * the system is to be used outside of these restrictions. The AD groups allowed
 * to log in are restricted by iSolutions, so it can be assumed that any user
 * who gets to this stage is in a permitted group (currently fpStaff, fpStudent,
 * or pjStudent for maths).
 */
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
  // Login successful - now extract list of AD groups from token response
  const msUserID = tokenResponse?.idTokenClaims?.oid;
  if (!msUserID)
    throw new AuthenticationError("Authentication with Microsoft failed. Please try again.");
  const userGroups = tokenResponse?.idTokenClaims?.groups ?? [];
  const isStaff = userGroups.includes("allStaff");
  const isStudent = userGroups.includes("allStudent");
  if (!isStaff && !isStudent)
    throw new AuthenticationError("Your account isn't in either the staff or student groups. Are you using the correct account?");
  // Now call MS Graph to fetch UPN and display name
  const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me?$select=userPrincipalName,jobTitle,department,employeeId,givenName,surname", {
    headers: { Authorization: `Bearer ${tokenResponse.accessToken}`, },
  });
  const userData = graphResponse.data;
  if (!userData)
    throw new AuthenticationError("Authentication with Microsoft failed. Please try again.");
  // Extract the relevant user profile fields
  const email = userData.userPrincipalName;
  const department = userData.department;
  const employeeId = userData.employeeId;
  const firstName = userData.givenName;
  const surname = userData.surname;
  const displayName = `${firstName} ${surname}`;
  // Find user in database
  const dbRecord = await userModel.findOne( { email }, "_id email displayName role", );
  if (dbRecord) {
    // If the user state is "placeholder", set both the display name and role
    if (dbRecord.role === "placeholder") {
      dbRecord.role = isStaff ? "staff" : "student";
      dbRecord.displayName = displayName;
      await dbRecord.save();
    }
    // If the user was a student and is now staff, update their record
    else if (dbRecord.role === "student" && isStaff) {
      dbRecord.role = "staff";
      dbRecord.displayName = displayName;
      await dbRecord.save();
    }
    // Update display name in case this has changed since last login
    else if (dbRecord.displayName !== displayName) {
      dbRecord.displayName = displayName;
      await dbRecord.save();
    }
    // Start the session
    req.session.userId = dbRecord._id;
    req.session.email = dbRecord.email;
    req.session.role = dbRecord.role;
    const canCreateAssignments = process.env?.ASSIGNMENTS_ADMIN_LOCK === "true" ? dbRecord.role === "admin" : ["staff", "admin"].includes(dbRecord.role);
    res.json({
      message: "Logged in successfully. Welcome back!",
      data: {
        userId: dbRecord._id,
        email: dbRecord.email,
        displayName: dbRecord.displayName,
        role: dbRecord.role,
        canCreateAssignments,
      },
    });
  } else {
    // Create a new account for this user
    const createdAccount = await userModel.create({
      displayName,
      email,
      role: isStaff ? "staff" : "student",
    });
    if (!createdAccount)
      throw new AuthenticationError("Something went wrong creating your account. Please try again.");
    req.session.userId = createdAccount._id;
    req.session.email = createdAccount.email;
    req.session.role = createdAccount.role;
    const canCreateAssignments = process.env?.ASSIGNMENTS_ADMIN_LOCK === "true" ? dbRecord.role === "admin" : ["staff", "admin"].includes(dbRecord.role); 
    res.json({
      message: "Account created successfully. Welcome!",
      data: {
        userId: createdAccount._id,
        email: createdAccount.email,
        displayName: createdAccount.displayName,
        role: createdAccount.role,
        canCreateAssignments,
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

