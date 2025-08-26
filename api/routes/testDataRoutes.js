const express = require("express");
const asyncHandler = require('express-async-handler');
const testDataC = require("../controllers/testDataController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/randomise-skill-ratings", requireLoggedIn("admin"), asyncHandler(testDataC.randomiseSkillRatings));
router.get("/send-test-email", requireLoggedIn("admin"), asyncHandler(testDataC.sendTestEmail));

module.exports = router;
