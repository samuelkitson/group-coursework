const express = require("express");
const asyncHandler = require('express-async-handler');
const meetingC = require("../controllers/meetingController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/", requireLoggedIn(), asyncHandler(meetingC.getMeetingsForTeam));
router.post("/", requireLoggedIn("student"), asyncHandler(meetingC.recordNewMeeting));
router.delete("/:meeting", requireLoggedIn(), asyncHandler(meetingC.deleteMeeting));
router.put("/:meeting", requireLoggedIn(), asyncHandler(meetingC.updateMeeting));
router.post("/:meeting/dispute", requireLoggedIn("student"), asyncHandler(meetingC.addMeetingDispute));
router.patch("/:meeting/dispute", requireLoggedIn(), asyncHandler(meetingC.updateMeetingDispute));
module.exports = router;
