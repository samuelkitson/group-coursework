const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const teamModel = require("../models/team");
const { Types } = require("mongoose");
const { checkAssignmentRole, isValidEmail } = require("../utility/auth");
const { InvalidParametersError, InvalidObjectIdError, GenericNotFoundError } = require("../errors/errors");

exports.getSupervisors = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  const supervisors = await assignmentModel.getSupervisorsWithTeams(req.query.assignment);
  return res.json({ supervisors });
};

exports.setSupervisors = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  if (!req.body.supervisors || !Array.isArray(req.body.supervisors))
    throw new InvalidParametersError("Please provide an array of user IDs.");
  const assignment = await assignmentModel.findById(req.body.assignment);
  const userIds = req.body.supervisors.map(id => new Types.ObjectId(id));
  // Check that none of them are students or staff on the module
  const staffList = assignment.lecturers.map(s => s.toString());
  const studentsList = assignment.students.map(s => s.toString());
  for (const supervisor of userIds) {
    const supervisorId = supervisor.toString();
    if (staffList.includes(supervisorId))
      throw new InvalidParametersError("One of the supervisors is already a staff member on the module.");
    if (studentsList.includes(supervisorId))
      throw new InvalidParametersError("One of the supervisors is a student on the module.");
  }
  // Check that the user IDs are valid
  const users = await userModel.find({_id: { $in: req.body.supervisors }}).select("_id").lean();
  if (users.length !== userIds.length)
    throw new InvalidParametersError("Some of the supervisors selected aren't valid.");
  await assignmentModel.updateOne({_id: req.body.assignment}, { supervisors: req.body.supervisors });
  return res.json({message: "Supervisors list updated successfully."});
};

/**
 * Add a supervisor by their email address. Currently only allows existing users
 * to be added.
 */
exports.addSupervisor = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  if (!req.body.supervisor)
    throw new InvalidParametersError("Please provide a supervisor email address.");
  const assignment = await assignmentModel.findById(req.body.assignment);
  // Check that the user exists
  let user = await userModel.findOne({ email: req.body.supervisor });
  let successMessage = "Supervisor added succesfully.";
  if (!user) {
    // Create a placeholder account for them
    user = await userModel.createPlaceholder(req.body.supervisor);
    successMessage = "A placeholder account has been created. Please ask the supervisor to log into the app.";
  }
  // throw new InvalidParametersError("A user with that email address could not be found. Please make sure they've previously logged into the app.");
  // Check that the user isn't a staff member or student on the module already
  const staffList = assignment.lecturers.map(s => s.toString());
  const studentsList = assignment.students.map(s => s.toString());
  const supervisorsList = assignment.supervisors.map(s => s.toString());
  if (staffList.includes(user._id.toString()))
      throw new InvalidParametersError("That person is a staff member on the module.");
  if (studentsList.includes(user._id.toString()))
      throw new InvalidParametersError("That person is a student on the module.");
  if (supervisorsList.includes(user._id.toString()))
      throw new InvalidParametersError("That person is already a supervisor on the module.");
  await assignmentModel.updateOne(
    { _id: req.body.assignment, },
    { $addToSet: { supervisors: user._id }},
  );
  return res.json({ message: successMessage });
};

exports.bulkAddSupervisors = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  if (!req.body.supervisors || !Array.isArray(req.body.supervisors))
    throw new InvalidObjectIdError("Please provide a list of supervisor emails.");
  if (!req.body.supervisors.every(isValidEmail))
    throw new InvalidParametersError("Some of the email addresses provided were invalid.");
  const supervisorIDs = await userModel.findOrPlaceholderBulk(req.body.supervisors.map(u => ({email: u, displayName: u})));
  // Check that none of these people are already registered as staff/students
  const assignment = await assignmentModel.findById(req.body.assignment);
  const staffList = assignment.lecturers.map(s => s.toString());
  const studentsList = assignment.students.map(s => s.toString());
  const staffStudentsList = new Set(staffList.concat(studentsList));
  const crossovers = supervisorIDs.map(s => s.toString()).filter(e => staffStudentsList.has(e));
  if (crossovers.length > 0)
    throw new InvalidParametersError("Some of the users provided are either staff or students on this assignment, and can't become supervisors.");
  // No crossovers, so safe to add
  await assignmentModel.updateOne(
    { _id: req.body.assignment, },
    { $addToSet: { supervisors: { $each: supervisorIDs } }},
  );
  return res.json({ message: `${supervisorIDs.length} supervisors have been added.` });
};

exports.changeSupervisorTeams = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  if (!Types.ObjectId.isValid(req.params.supervisor))
    throw new InvalidObjectIdError("The provided supervisor ID is invalid.");
  if (!req.body.teams || !Array.isArray(req.body.teams))
    throw new InvalidObjectIdError("Please provide a list of teams.");
  // Make sure the supervisor is listed on the module
  const assignment = await assignmentModel.findOne({ _id: req.body.assignment, supervisors: req.params.supervisor });
  if (!assignment)
    throw new GenericNotFoundError("That person isn't listed as a supervisor on the module. Please refresh and try again.");
  // Check that the teams are valid and from this assignment
  const teamIds = req.body.teams.map(id => new Types.ObjectId(id));
  const teams = await teamModel.find({_id: { $in: teamIds }, assignment: req.body.assignment }).select("_id").lean();
  if (teams.length !== req.body.teams.length)
    throw new InvalidParametersError("Some of the teams selected weren't valid. Please try again.");
  // Remove them from any teams they currently supervise for this assignment
  await teamModel.updateMany(
    { assignment: req.body.assignment, supervisors: req.params.supervisor, },
    { $pull: { supervisors: req.params.supervisor }},
  );
  await teamModel.updateMany(
    { assignment: req.body.assignment, _id: { $in: teamIds }, },
    { $addToSet: { supervisors: req.params.supervisor }},
  );
  return res.json({ message: "Supervisor teams updated successfully."});
};

exports.removeSupervisor = async (req, res) => {
  await checkAssignmentRole(req.query.assignment, req.session.userId, "lecturer");
  if (!Types.ObjectId.isValid(req.params.supervisor))
    throw new InvalidObjectIdError("The provided supervisor ID is invalid.");
  await teamModel.updateMany(
    { assignment: req.query.assignment, supervisors: req.params.supervisor, },
    { $pull: { supervisors: req.params.supervisor }},
  );
  await assignmentModel.updateOne(
    { _id: req.query.assignment },
    { $pull: { supervisors: req.params.supervisor }},
  );
  return res.json({ message: "Supervisor removed successfully."});
};

function getKeyOfMinValue(obj) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return undefined;
  return keys.reduce((minKey, currentKey) => {
    return obj[currentKey] < obj[minKey] ? currentKey : minKey;
  });
};

exports.autoAllocateSupervisors = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  const assignment = await assignmentModel.findById(req.body.assignment).select("supervisors").lean();
  const teamsWithoutSupervisors = await teamModel.find({
    assignment: req.body.assignment,
    supervisors: [],
  });
  if (teamsWithoutSupervisors.length === 0)
    throw new InvalidParametersError("All teams have a supervisor already.");
  const supervisors = assignment.supervisors ?? [];
  if (supervisors.length === 0)
    throw new InvalidParametersError("You need to add some supervisors first.");
  const supervisorTeamCounts = await teamModel.getNumberOfSupervisees(supervisors);
  for (const team of teamsWithoutSupervisors) {
    const nextSupervisor = getKeyOfMinValue(supervisorTeamCounts);
    team.supervisors.push(nextSupervisor);
    supervisorTeamCounts[nextSupervisor] += 1;
    await team.save();
  }
  return res.json({ message: "Supervisors allocated successfully. "});
};
