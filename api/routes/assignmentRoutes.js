const express = require("express");
const asyncHandler = require('express-async-handler');
const assignmentC = require("../controllers/assignmentController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.post("/", requireLoggedIn("staff"), asyncHandler(assignmentC.createAssignment));
router.get("/all", requireLoggedIn(), asyncHandler(assignmentC.getAllVisible));
router.delete("/:assignment", requireLoggedIn("staff"), asyncHandler(assignmentC.deleteAssignment));
router.patch("/:assignment", requireLoggedIn("staff"), asyncHandler(assignmentC.updateAssignmentInfo));
router.get("/:assignment/students", requireLoggedIn("staff"), asyncHandler(assignmentC.getEnrolledStudents));
router.get("/:assignment/skills", requireLoggedIn(), asyncHandler(assignmentC.getSkills));
router.patch("/:assignment/skills", requireLoggedIn("staff"), asyncHandler(assignmentC.setSkills));
router.patch("/:assignment/state", requireLoggedIn("staff"), asyncHandler(assignmentC.setState));
router.put("/:assignment/staff", requireLoggedIn("staff"), asyncHandler(assignmentC.setStaff));

module.exports = router;
