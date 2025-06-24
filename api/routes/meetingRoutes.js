const express = require("express");
const asyncHandler = require('express-async-handler');
const meetingC = require("../controllers/meetingController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/", requireLoggedIn(), asyncHandler(meetingC.getMeetingsForTeam));
router.post("/", requireLoggedIn(), asyncHandler(meetingC.recordNewMeeting));
router.post("/:meeting/dispute", requireLoggedIn(), asyncHandler(meetingC.addMeetingDispute));
module.exports = router;
