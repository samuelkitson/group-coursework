require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const { emailTransporter } = require("./utility/emails");

const { API_PORT, SESSION_SECRET } = process.env;
const { COOKIE_NAME } = require("./config/constants");
const routes = require("./routes");
const { requireLoggedIn } = require("./utility/auth");
const { mongoUri } = require("./config/db");
const { errorHandler } = require("./errors/errorMiddleware");

const app = express();

// Allow cookies to pass through nginx proxy
app.set("trust proxy", "loopback");

// Use EJS as a templating engine (for exportable reports)
app.set("view engine", "ejs");

// JSON middleware setup
app.use(express.json({ limit: "1mb" }));

// Set up MongoDB session storage
var sessionStore = new MongoDBStore({
  uri: mongoUri,
  databaseName: "groupsappdb",
  collection: "sessions",
});

// Session middleware setup
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: COOKIE_NAME,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
    store: sessionStore,
  }),
);

// Register all routes
app.use("/api", routes);

if (require.main === module) {
  app.listen(API_PORT, () => {
    console.log(`Group courseworks API started on port ${API_PORT}`);
    console.log("NODE_ENV:", process.env.NODE_ENV);
  });
}

app.use(errorHandler);

module.exports = app;
