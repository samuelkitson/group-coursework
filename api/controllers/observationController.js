const observationModel = require("../models/observation");
const teamModel = require("../models/team");
const { Types } = require("mongoose");
const { checkTeamRole } = require("../utility/auth");
const { InvalidParametersError, InvalidObjectIdError, GenericNotFoundError } = require("../errors/errors");

// Provide the details in the request body
exports.addObservation = async (req, res) => {
  const userRole = await checkTeamRole(req.body.team, req.session.userId, "supervisor/lecturer");
  if (!req.body.comment)
    throw new InvalidParametersError("You must provide an observation comment.");
  const observationObj = { team: req.body.team, comment: req.body.comment, observer: req.session.userId, }
  if (req.body.students) {
    // If the observation is about specific student(s), check that they're
    // actually on this team.
    if (!req.body.students.every(s => Types.ObjectId.isValid(s))) {
      throw new InvalidObjectIdError("One or more of the provided student IDs is invalid.");
    }
    const team = await teamModel.findOne({ _id: req.body.team, members: { $all: req.body.students }});
    if (!team) {
      throw new GenericNotFoundError("One or more of the students listed is not a team member.");
    } else {
      observationObj.students = req.body.students;
    }
  }
  await observationModel.create(observationObj);
  return res.json({ message: "Observation created successfully." });
};

// Get the observations for a specific team
exports.getObservations = async (req, res) => {
  const userRole = await checkTeamRole(req.query.team, req.session.userId, "supervisor/lecturer");
  const observations = await observationModel.find({ team: req.query.team })
    .populate("observer students", "displayName")
    .select("_id observer comment students createdAt")
    .sort({ createdAt: 1 }).lean();
  return res.json({ observations });
};
