const express = require("express");
const asyncHandler = require('express-async-handler');
const checkinC = require("../controllers/checkinController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/", requireLoggedIn("student"), asyncHandler(checkinC.getCheckinStateStudent));
router.post("/", requireLoggedIn("student"), asyncHandler(checkinC.submitCheckIn));
router.get("/history", requireLoggedIn(), asyncHandler(checkinC.getCheckInHistory));
router.get("/response", requireLoggedIn(), asyncHandler(checkinC.getCheckInResponse));
router.patch("/response", requireLoggedIn(), asyncHandler(checkinC.moderateResponse));
module.exports = router;
