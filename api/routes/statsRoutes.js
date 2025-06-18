const express = require("express");
const asyncHandler = require('express-async-handler');
const statsC = require("../controllers/statsController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/skills", requireLoggedIn("lecturer"), asyncHandler(statsC.skillsBreakdown));
router.get("/team-skills", requireLoggedIn("student"), asyncHandler(statsC.teamSkillsBreakdown));
router.get("/team-meetings", requireLoggedIn("student"), asyncHandler(statsC.teamMeetingsBreakdown));

module.exports = router;
