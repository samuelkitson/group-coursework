const express = require("express");
const asyncHandler = require('express-async-handler');
const testDataC = require("../controllers/testDataController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get(
  "/randomise-skill-ratings",
  requireLoggedIn("staff"),
  asyncHandler(testDataC.randomiseSkillRatings),
);
router.get(
  "/add-random-students",
  requireLoggedIn("staff"),
  asyncHandler(testDataC.addRandomStudents),
);
router.get(
  "/add-random-checkins",
  requireLoggedIn("staff"),
  asyncHandler(testDataC.addRandomCheckins),
);
router.get(
  "/add-random-meetings",
  requireLoggedIn("staff"),
  asyncHandler(testDataC.addRandomMeetings),
);
router.get(
  "/provision-lecturer",
  asyncHandler(testDataC.provisionTemporaryLecturer),
);
router.get(
  "/provision-student",
  asyncHandler(testDataC.provisionTemporaryStudent),
);
router.get(
  "/send-test-email",
  requireLoggedIn("admin"),
  asyncHandler(testDataC.sendTestEmail),
)

module.exports = router;
