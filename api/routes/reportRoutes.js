const express = require("express");
const asyncHandler = require('express-async-handler');
const reportC = require("../controllers/reportController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/team", requireLoggedIn(), asyncHandler(reportC.generateTeamReports));
router.get("/assignment", requireLoggedIn(), asyncHandler(reportC.generateTeamReportsBulk));
module.exports = router;
