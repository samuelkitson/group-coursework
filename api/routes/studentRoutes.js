const express = require("express");
const asyncHandler = require('express-async-handler');
const studentC = require("../controllers/studentController");
const { requireLoggedIn } = require("../utility/auth");
const { fileUpload } = require("../config/uploads");

const router = express.Router();

router.post("/enrol", requireLoggedIn("staff"), fileUpload.single("students"), asyncHandler(studentC.enrolStudentsOnAssignment));
router.patch("/unenrol", requireLoggedIn("staff"), asyncHandler(studentC.removeFromAssignment));
router.post("/unenrol-all", requireLoggedIn("staff"), asyncHandler(studentC.removeAllFromAssignment));
router.put("/exclusions", requireLoggedIn("staff"), asyncHandler(studentC.setPairingExclusions));
router.get("/profile", requireLoggedIn("student"), asyncHandler(studentC.getProfile));
router.patch("/profile", requireLoggedIn("student"), asyncHandler(studentC.updateOwnProfile));

module.exports = router;
