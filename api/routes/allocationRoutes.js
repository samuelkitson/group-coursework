const express = require("express");
const asyncHandler = require('express-async-handler');
const allocationC = require("../controllers/allocationController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get("/:assignment/options", requireLoggedIn("lecturer"), asyncHandler(allocationC.getAllocationOptions));
router.get("/:assignment/setup", requireLoggedIn("lecturer"), asyncHandler(allocationC.getAllocationSetup));
router.put("/:assignment/setup", requireLoggedIn("lecturer"), asyncHandler(allocationC.setAllocationSetup));
router.post("/:assignment/run", requireLoggedIn("lecturer"), asyncHandler(allocationC.runAllocation));
router.post("/:assignment", requireLoggedIn("lecturer"), asyncHandler(allocationC.confirmAllocation));
module.exports = router;
