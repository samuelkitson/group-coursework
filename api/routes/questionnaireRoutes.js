const express = require("express");
const asyncHandler = require('express-async-handler');
const questionnaireC = require("../controllers/questionnaireController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.get(
  "/skills",
  requireLoggedIn(),
  asyncHandler(questionnaireC.getAllocationQuestionnaire),
);
router.patch(
  "/skills",
  requireLoggedIn("student"),
  asyncHandler(questionnaireC.updateUserSkills),
);
router.get(
  "/existing-skills",
  requireLoggedIn("lecturer"),
  asyncHandler(questionnaireC.allExistingSkills),
);

module.exports = router;
