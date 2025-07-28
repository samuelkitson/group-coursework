const express = require("express");

// Import all routing files
const authRoutes = require("./authRoutes");
const assignmentRoutes = require("./assignmentRoutes");
const studentRoutes = require("./studentRoutes");
const questionnaireRoutes = require("./questionnaireRoutes");
const statsRoutes = require("./statsRoutes");
const allocationRoutes = require("./allocationRoutes");
const teamRoutes = require("./teamRoutes");
const meetingRoutes = require("./meetingRoutes");
const checkinRoutes = require("./checkinRoutes");
const peerReviewRoutes = require("./peerReviewRoutes");
const supervisorRoutes = require("./supervisorRoutes");
const reportRoutes = require("./reportRoutes");
const testDataRoutes = require("./testDataRoutes");
const observationRoutes = require("./observationRoutes");

const router = express.Router();

// Register all imported routes
router.use("/auth", authRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/student", studentRoutes);
router.use("/questionnaire", questionnaireRoutes);
router.use("/stats", statsRoutes);
router.use("/allocation", allocationRoutes);
router.use("/team", teamRoutes);
router.use("/checkin", checkinRoutes);
router.use("/meeting", meetingRoutes);
router.use("/peer-review", peerReviewRoutes);
router.use("/supervisor", supervisorRoutes);
router.use("/report", reportRoutes);
router.use("/observation", observationRoutes);
router.use("/test", testDataRoutes);

// Heartbeat endpoint to check session status
router.get("/heartbeat", (req, res) => {
  res.json({ online: true, loggedIn: req.session.email != null, version: "2.0", });
});

module.exports = router;
