const express = require("express");
const asyncHandler = require('express-async-handler');
const authC = require("../controllers/authController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.post("/login", asyncHandler(authC.login));
router.get("/refresh", requireLoggedIn(), asyncHandler(authC.refreshUserData));
router.post("/logout", requireLoggedIn(), asyncHandler(authC.logout));
router.get("/azure-login", asyncHandler(authC.getAzureLoginLink));
router.post("/azure-callback", asyncHandler(authC.azureLoginCallback));
router.get("/search", requireLoggedIn("staff"), asyncHandler(authC.searchForUser));

module.exports = router;
