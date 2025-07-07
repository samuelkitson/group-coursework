const bcrypt = require("bcryptjs");
const { Types } = require("mongoose");
const crypto = require("crypto");

const { COOKIE_NAME } = require("../config/constants");

const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");
const { SessionInvalidError, AuthenticationError, ConfigurationError } = require("../errors/errors");
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

exports.databaseTest = async (req, res) => {
  const dbAssignments = await assignmentModel.find();

  res.json(dbAssignments);
};

exports.getGitHubLoginLink = async (req, res) => {
  // Check that we're set up for GitHub login correctly
  const client_id = process.env?.GITHUB_CLIENT_ID;
  const redirect_uri = process.env?.OAUTH_REDIRECT_URI;
  if (!client_id || !redirect_uri)
    throw new ConfigurationError("Missing GitHub OAuth environment variables", "Sorry, login with GitHub is currently unavailable.");
  // Generate secure state variable token
  const state = crypto.randomUUID();
  req.session.oauthState = state;
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${client_id}&` +
    `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
    `state=${state}&` +
    `scope=user:email`;
  res.json({ authUrl });
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
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${urlParams.toString()}`;
  res.json({ authUrl });
};

exports.gitHubLoginCallback = async (req, res) => {
  // Check that we're set up for GitHub login correctly
  const client_id = process.env?.GITHUB_CLIENT_ID;
  const client_secret = process.env?.GITHUB_CLIENT_SECRET;
  if (!client_id || !client_secret)
    throw new ConfigurationError("Missing GitHub OAuth environment variables", "Sorry, login with GitHub is currently unavailable.");
  // Check the state token is valid
  const { code, state } = req.body;
  const oAuthState = req.session.oauthState ?? undefined;
  delete req.session.oauthState;
  if (!state || state !== oAuthState)
    throw new AuthenticationError("Invalid OAuth state parameter. Please try again.");
  const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
    client_id,
    client_secret,
    code: code
  }, {
    headers: { 
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
  // Pull GitHub data for this user
  const accessToken = tokenResponse.data.access_token;
  if (!accessToken)
    throw new AuthenticationError("No access token received from GitHub. Please try again.");
  const userResponse = await axios.get('https://api.github.com/user', {
    headers: { "Authorization": `token ${accessToken}` }
  });
  if (!userResponse)
    throw new AuthenticationError("Something went wrong fetching your GitHub account info. Please try again.");
  const emailResponse = await axios.get("https://api.github.com/user/emails", {
    headers: { "Authorization": `token ${accessToken}` }
  });
  const userEmail = emailResponse.data.find(e => e.primary);
  if (!userEmail)
    throw new AuthenticationError("No primary email could be found for your GitHub account. Please check your account and try again");
  // Find user in database
  const dbRecord = await userModel.findOne( { email: userEmail.email }, "_id email displayName role", );
  // if (!dbRecord)
  //   throw new AuthenticationError(`${userEmail.email} isn't associated with any accounts. Please try a different GitHub account.`);
  if (dbRecord) {
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
      displayName: userResponse?.data?.name ?? userEmail.email,
      email: userEmail.email,
      role: "student",
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
  // Login successful
  // const accessToken = tokenResponse.accessToken;
  // const idToken = tokenResponse.idToken;
  const { preferred_username: email, name } = tokenResponse.idTokenClaims;
  if (!email)
    throw new AuthenticationError("No email found in Microsoft profile.");
  // Find user in database
  const dbRecord = await userModel.findOne( { email }, "_id email displayName role", );
  if (dbRecord) {
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
      displayName: name ?? email,
      email: email,
      role: "student",
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
