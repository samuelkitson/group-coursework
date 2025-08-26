const express = require("express");
const asyncHandler = require('express-async-handler');
const teamC = require("../controllers/teamController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/all", requireLoggedIn(), asyncHandler(teamC.getAllForAssignment));
router.get("/csv", requireLoggedIn("staff"), asyncHandler(teamC.downloadTeamsCsv));
router.get("/mine", requireLoggedIn(), asyncHandler(teamC.getMyTeam));
router.post("/new", requireLoggedIn("staff"), asyncHandler(teamC.newTeam));
router.post("/:team/new-member", requireLoggedIn("staff"), asyncHandler(teamC.addMember));

module.exports = router;
