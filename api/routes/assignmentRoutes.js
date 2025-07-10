const express = require("express");
const asyncHandler = require('express-async-handler');
const assignmentC = require("../controllers/assignmentController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.post("/", requireLoggedIn(), asyncHandler(assignmentC.createAssignment));
router.get("/all", requireLoggedIn(), asyncHandler(assignmentC.getAllVisible));
router.delete("/:assignment", requireLoggedIn(), asyncHandler(assignmentC.deleteAssignment));
router.patch("/:assignment", requireLoggedIn(), asyncHandler(assignmentC.updateAssignmentInfo));
router.get("/:assignment/students", requireLoggedIn(), asyncHandler(assignmentC.getEnrolledStudents));
router.get("/:assignment/skills", requireLoggedIn(), asyncHandler(assignmentC.getSkills));
router.patch("/:assignment/skills", requireLoggedIn(), asyncHandler(assignmentC.setSkills));
router.patch("/:assignment/state", requireLoggedIn(), asyncHandler(assignmentC.setState));
router.put("/:assignment/staff", requireLoggedIn(), asyncHandler(assignmentC.setStaff));

router.get("/:assignment/supervisor", requireLoggedIn(), asyncHandler(assignmentC.getSupervisors));
router.put("/:assignment/supervisor", requireLoggedIn(), asyncHandler(assignmentC.setSupervisors));
router.post("/:assignment/supervisor", requireLoggedIn(), asyncHandler(assignmentC.addSupervisor));
router.post("/:assignment/supervisor/bulk", requireLoggedIn(), asyncHandler(assignmentC.bulkAddSupervisors));
router.patch("/:assignment/supervisor/:supervisor", requireLoggedIn(), asyncHandler(assignmentC.changeSupervisorTeams));
router.delete("/:assignment/supervisor/:supervisor", requireLoggedIn(), asyncHandler(assignmentC.removeSupervisor));

module.exports = router;
