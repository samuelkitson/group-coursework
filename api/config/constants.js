require("dotenv").config();

module.exports = {
  PORT: 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
  COOKIE_NAME: "groups-auth",
  BCRYPT_ROUNDS: 12,
};
