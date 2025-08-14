const express = require("express");
const asyncHandler = require('express-async-handler');
const statsC = require("../controllers/statsController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/skills", requireLoggedIn(), asyncHandler(statsC.skillsBreakdown));
router.get("/team-skills", requireLoggedIn(), asyncHandler(statsC.teamSkillsBreakdown));
router.get("/team-meetings", requireLoggedIn(), asyncHandler(statsC.teamMeetingsBreakdown));
router.get("/questionnaire-engagement", requireLoggedIn(), asyncHandler(statsC.questionnaireEngagement));
router.get("/team-skills", requireLoggedIn(), asyncHandler(statsC.teamSkillsBreakdown));

module.exports = router;
