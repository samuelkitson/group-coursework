const express = require("express");
const asyncHandler = require('express-async-handler');
const teamC = require("../controllers/teamController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/all", requireLoggedIn("lecturer"), asyncHandler(teamC.getAllForAssignment));
router.get("/csv", requireLoggedIn("lecturer"), asyncHandler(teamC.downloadTeamsCsv));
router.get(
  "/mine",
  requireLoggedIn("student"),
  asyncHandler(teamC.getMyTeam),
);
router.post("/:team/new-member", requireLoggedIn("lecturer"), asyncHandler(teamC.addMember));

module.exports = router;
