const express = require("express");
const asyncHandler = require('express-async-handler');
const supervisorC = require("../controllers/supervisorController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/", requireLoggedIn("staff"), asyncHandler(supervisorC.getSupervisors));
router.post("/", requireLoggedIn("staff"), asyncHandler(supervisorC.addSupervisor));
router.post("/bulk", requireLoggedIn("staff"), asyncHandler(supervisorC.bulkAddSupervisors));
router.patch("/:supervisor", requireLoggedIn("staff"), asyncHandler(supervisorC.changeSupervisorTeams));
router.delete("/:supervisor", requireLoggedIn("staff"), asyncHandler(supervisorC.removeSupervisor));
router.post("/allocate", requireLoggedIn("staff"), asyncHandler(supervisorC.autoAllocateSupervisors));
router.post("/notification-emails", requireLoggedIn("staff"), asyncHandler(supervisorC.sendAllocatedNotificationEmail));

module.exports = router;
