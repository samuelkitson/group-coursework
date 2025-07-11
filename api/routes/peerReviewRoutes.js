const express = require("express");
const asyncHandler = require('express-async-handler');
const peerReviewC = require("../controllers/peerReviewController");
const { requireLoggedIn } = require("../utility/auth");
const peerReview = require("../models/peerReview");

const router = express.Router();

router.get("/", requireLoggedIn(), asyncHandler(peerReviewC.getPeerReviewStructure));
router.put("/", requireLoggedIn(), asyncHandler(peerReviewC.updatePeerReviewsByAssignment));
module.exports = router;
