const express = require("express");
const asyncHandler = require('express-async-handler');
const supervisorC = require("../controllers/supervisorController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/", requireLoggedIn(), asyncHandler(supervisorC.getSupervisors));
router.put("/", requireLoggedIn(), asyncHandler(supervisorC.setSupervisors));
router.post("/", requireLoggedIn(), asyncHandler(supervisorC.addSupervisor));
router.post("/bulk", requireLoggedIn(), asyncHandler(supervisorC.bulkAddSupervisors));
router.patch("/:supervisor", requireLoggedIn(), asyncHandler(supervisorC.changeSupervisorTeams));
router.delete("/:supervisor", requireLoggedIn(), asyncHandler(supervisorC.removeSupervisor));

module.exports = router;
