const express = require("express");
const asyncHandler = require('express-async-handler');
const authC = require("../controllers/authController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.post("/login", asyncHandler(authC.login));
router.get("/refresh", requireLoggedIn(), asyncHandler(authC.refreshUserData));
router.post("/logout", requireLoggedIn(), asyncHandler(authC.logout));
router.get("/database-test", requireLoggedIn(), asyncHandler(authC.databaseTest));
router.get("/github/login", asyncHandler(authC.getGitHubLoginLink));
router.post("/github/callback", asyncHandler(authC.gitHubLoginCallback));

module.exports = router;
