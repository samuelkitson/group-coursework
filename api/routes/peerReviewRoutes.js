const express = require("express");
const asyncHandler = require('express-async-handler');
const peerReviewC = require("../controllers/peerReviewController");
const { requireLoggedIn } = require("../utility/auth");
const peerReview = require("../models/peerReview");

const router = express.Router();

router.get("/", requireLoggedIn(), asyncHandler(peerReviewC.getPeerReviewStructure));
router.put("/", requireLoggedIn("staff"), asyncHandler(peerReviewC.updatePeerReviewsByAssignment));
router.post("/reminders", requireLoggedIn("staff"), asyncHandler(peerReviewC.sendReminderEmails));
router.get("/current-status", requireLoggedIn("staff"), asyncHandler(peerReviewC.getCurrentStatus));
module.exports = router;
