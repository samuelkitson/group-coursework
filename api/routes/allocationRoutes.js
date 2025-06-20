const express = require("express");
const asyncHandler = require('express-async-handler');
const allocationC = require("../controllers/allocationController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/:assignment/options", requireLoggedIn(), asyncHandler(allocationC.getAllocationOptions));
router.get("/:assignment/setup", requireLoggedIn(), asyncHandler(allocationC.getAllocationSetup));
router.put("/:assignment/setup", requireLoggedIn(), asyncHandler(allocationC.setAllocationSetup));
router.post("/:assignment/run", requireLoggedIn(), asyncHandler(allocationC.runAllocation));
router.post("/:assignment", requireLoggedIn(), asyncHandler(allocationC.confirmAllocation));
module.exports = router;
