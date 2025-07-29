require("dotenv").config();

/**
 * CHECKIN_THRESHOLDS - defines the point at which a student's average check-in
 *   score is marked as too high or low. This is given as the average deviation
 *   from the baseline in the scores recevied by that individual. For example,
 *   receiving scores of [1, 2, 2, 6] gives deviations from 4 of [-3, -2, -2, 2]
 *   and the average would be -1.25 (quite a low score).
 */

module.exports = {
  SESSION_SECRET: process.env.SESSION_SECRET,
  COOKIE_NAME: "groups-auth",
  BCRYPT_ROUNDS: 12,
  CHECKIN_THRESHOLDS: {
    VERY_LOW: -1.75,
    LOW: -1,
    HIGH: 1,
    VERY_HIGH: 1.75,
  },
};
