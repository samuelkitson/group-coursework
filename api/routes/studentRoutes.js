const express = require("express");
const asyncHandler = require('express-async-handler');
const studentC = require("../controllers/studentController");
const { requireLoggedIn } = require("../utility/auth");
const { fileUpload } = require("../config/uploads");

const router = express.Router();

router.post(
  "/upload",
  requireLoggedIn("staff"),
  fileUpload.single("csv"),
  asyncHandler(studentC.upload),
);
router.patch(
  "/unenrol",
  requireLoggedIn(),
  asyncHandler(studentC.removeFromAssignment),
);
router.put(
  "/exclusions",
  requireLoggedIn("staff"),
  asyncHandler(studentC.setPairingExclusions),
);
router.get(
  "/profile",
  requireLoggedIn("student"),
  asyncHandler(studentC.getProfile),
);
router.patch(
  "/profile",
  requireLoggedIn("student"),
  asyncHandler(studentC.updateOwnProfile),
);

module.exports = router;
