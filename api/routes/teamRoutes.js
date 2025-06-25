const express = require("express");
const asyncHandler = require('express-async-handler');
const teamC = require("../controllers/teamController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/all", requireLoggedIn(), asyncHandler(teamC.getAllForAssignment));
router.get("/csv", requireLoggedIn(), asyncHandler(teamC.downloadTeamsCsv));
router.get(
  "/mine",
  requireLoggedIn(),
  asyncHandler(teamC.getMyTeam),
);
router.post("/:team/new-member", requireLoggedIn(), asyncHandler(teamC.addMember));

module.exports = router;
