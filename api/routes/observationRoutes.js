const express = require("express");
const asyncHandler = require('express-async-handler');
const observationC = require("../controllers/observationController");
const { requireLoggedIn } = require("../utility/auth");

const router = express.Router();

router.post("/", requireLoggedIn(), asyncHandler(observationC.addObservation));
router.get("/", requireLoggedIn(), asyncHandler(observationC.getObservations));
router.delete("/:observation", requireLoggedIn(), asyncHandler(observationC.deleteObservation));

module.exports = router;
