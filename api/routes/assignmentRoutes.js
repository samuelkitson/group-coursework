const express = require("express");
const asyncHandler = require('express-async-handler');
const assignmentC = require("../controllers/assignmentController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.post("/", requireLoggedIn("lecturer"), asyncHandler(assignmentC.createAssignment));
router.get("/all", requireLoggedIn(), asyncHandler(assignmentC.getAllVisible));
router.delete("/:assignment", requireLoggedIn("lecturer"), asyncHandler(assignmentC.deleteAssignment));
router.patch("/:assignment", requireLoggedIn("lecturer"), asyncHandler(assignmentC.updateAssignmentInfo));
router.get(
  "/:assignment/students",
  requireLoggedIn("lecturer"),
  assignmentC.getEnrolledStudents,
);
router.get("/:assignment/skills", requireLoggedIn("lecturer"), asyncHandler(assignmentC.getSkills));
router.patch("/:assignment/skills", requireLoggedIn("lecturer"), asyncHandler(assignmentC.setSkills));
router.patch(
  "/:assignment/state",
  requireLoggedIn("lecturer"),
  assignmentC.setState,
);

module.exports = router;
