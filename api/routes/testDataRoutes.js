const express = require("express");
const asyncHandler = require('express-async-handler');
const testDataC = require("../controllers/testDataController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get(
  "/randomise-skill-ratings",
  requireLoggedIn("lecturer"),
  asyncHandler(testDataC.randomiseSkillRatings),
);
router.get(
  "/add-random-students",
  requireLoggedIn("lecturer"),
  asyncHandler(testDataC.addRandomStudents),
);
router.get(
  "/add-random-checkins",
  requireLoggedIn("lecturer"),
  asyncHandler(testDataC.addRandomCheckins),
);
router.get(
  "/add-random-meetings",
  requireLoggedIn("lecturer"),
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

module.exports = router;
