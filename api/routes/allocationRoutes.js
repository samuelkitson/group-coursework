const express = require("express");
const asyncHandler = require('express-async-handler');
const allocationC = require("../controllers/allocationController");
const { requireLoggedIn } = require("../utility/auth");
const { fileUpload } = require("../config/uploads");

const router = express.Router();

router.get("/:assignment/options", requireLoggedIn("staff"), asyncHandler(allocationC.getAllocationOptions));
router.get("/:assignment/setup", requireLoggedIn("staff"), asyncHandler(allocationC.getAllocationSetup));
router.put("/:assignment/setup", requireLoggedIn("staff"), asyncHandler(allocationC.setAllocationSetup));
router.post("/:assignment/run", fileUpload.single("dataset"), requireLoggedIn("staff"), asyncHandler(allocationC.runAllocation));
router.post("/:assignment", requireLoggedIn("staff"), asyncHandler(allocationC.confirmAllocation));
module.exports = router;
