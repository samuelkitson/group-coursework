const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const teamModel = require("../models/team");
const { Types } = require("mongoose");
const { checkAssignmentRole, isValidEmail } = require("../utility/auth");
const { InvalidParametersError, IncorrectRoleError, InvalidObjectIdError, GenericNotAllowedError, GenericNotFoundError } = require("../errors/errors");

exports.createAssignment = async (req, res) => {
  if (req.session.role === "student")
    throw new IncorrectRoleError("Students cannot create new assignments.");
  if (!req.body.name)
    throw new InvalidParametersError("You must provide an assignment name.");
  if (!req.body.description)
    throw new InvalidParametersError("You must provide an assignment description.");
  // If ASSIGNMENTS_ADMIN_LOCK is set, only allow admins to create assignments
  if (process.env?.ASSIGNMENTS_ADMIN_LOCK && req.session.role !== "admin")
    throw new IncorrectRoleError("You must be an admin to create new assignments.");
  const newAssignment = await assignmentModel.create({
    name: req.body.name,
    description: req.body.description,
    lecturers: [req.session.userId],
    state: "pre-allocation",
  });

  return res.json({message: "New assignment created successfully. ", assignmentId: newAssignment._id});
};

// Only allowed in pre-allocation state
exports.deleteAssignment = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  await assignmentModel.deleteOne({_id: new Types.ObjectId(req.params.assignment), state: "pre-allocation"});
  return res.json({message: "Assignment deleted successfully"});
};

exports.updateAssignmentInfo = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (!req.body.name)
    throw new InvalidParametersError("You must provide an assignment name.");
  if (!req.body.description)
    throw new InvalidParametersError("You must provide an assignment description.");
  await assignmentModel.findOneAndUpdate(
    {
      _id: req.params.assignment,
    },
    {
      name: req.body.name,
      description: req.body.description,
    },
  );
  return res.json({message: "Assignment updated successfully."});
};

exports.getAllVisible = async (req, res) => {
  const dbAssignments = await assignmentModel.getAssignmentsByUser(req.session.userId);
  return res.json(dbAssignments);
};

exports.getEnrolledStudents = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const studentsList = await assignmentModel.getStudents(req.params.assignment);
  return res.json(studentsList?.students);
};

exports.getSkills = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const skills = await assignmentModel.findById(req.params.assignment).select("skills");
  return res.json(skills);
};

exports.setSkills = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  // Get and check the new skills provided
  const updatedSkills = req.body.skills;
  if (!updatedSkills || typeof updatedSkills !== "object")
    return res.status(400).json({ message: "Invalid skills update." });
  // Update the assignment
  await assignmentModel.findOneAndUpdate(
    {
      _id: req.params.assignment,
    },
    {
      skills: updatedSkills,
    },
  );
  return res.json({ message: "Required skills updated successfully." });
};

exports.setState = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  // Check the current state and whether this move is valid
  const assignment = await assignmentModel.findById(req.params.assignment);
  const existingState = assignment.state;
  const newState = req.body.newState;
  const forceMove = req.body.force ?? false; // Must be true to move backwards
  if (
    ![
      "pre-allocation",
      "allocation-questions",
      "allocation",
      "live",
      "closed",
    ].includes(newState)
  ) {
    return res.status(400).json({
      message: "The new state is invalid.",
    });
  }
  // Check valid state moves one-by-one.
  var changeAllowed = false;
  var message = null;
  if (newState === "allocation-questions") {
    if (existingState === "pre-allocation") {
      changeAllowed = true;
      message = "The allocation questionnaire has been opened to students.";
    }
  }
  if (newState === "allocation") {
    if (existingState === "allocation-questions") {
      changeAllowed = true;
      message =
        "The allocation questionnaire has been closed. Head to the allocation page to create the teams.";
    }
  }
  if (newState === "live") {
    if (existingState === "allocation") {
      changeAllowed = true;
      message =
        "The assignment has been opened and students will be able to see their teams.";
    }
  }
  if (newState === "closed") {
    if (existingState === "live") {
      changeAllowed = true;
      message = "The assignment has been closed.";
    }
  }
  // Check whether the change was allowed or now
  if (!changeAllowed) {
    return res.status(400).json({
      message: message ?? "You can't move the assignment to that state.",
    });
  }
  assignment.state = newState;
  await assignment.save();
  return res.json({
    message: message ?? "Assignment state updated successfully.",
  });
};

exports.setStaff = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  // Check that all of the users provided a) exist and b) are staff
  if (!req.body.staff || !Array.isArray(req.body.staff))
    throw new InvalidParametersError("Please provide an array of staff IDs.");
  const staffIds = req.body.staff.map(id => new Types.ObjectId(id));
  if (!staffIds.some(s => s.equals(req.session.userId)))
    throw new InvalidParametersError("You can't remove yourself from a module.");
  const users = await userModel.find({_id: { $in: staffIds }, role: { $in: ["staff", "admin"] }}).select("_id").lean();
  if (users.length !== staffIds.length)
    throw new InvalidParametersError("Some of the staff members selected either haven't logged in before, or are listed as students.");
  await assignmentModel.updateOne({_id: req.params.assignment}, {lecturers: staffIds});
  return res.json({message: "Module team updated successfully."});
};

exports.getSupervisors = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const supervisors = await assignmentModel.getSupervisorsWithTeams(req.params.assignment);
  return res.json({ supervisors });
};

exports.setSupervisors = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (!req.body.supervisors || !Array.isArray(req.body.supervisors))
    throw new InvalidParametersError("Please provide an array of user IDs.");
  const assignment = await assignmentModel.findById(req.params.assignment);
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
  await assignmentModel.updateOne({_id: req.params.assignment}, { supervisors: req.body.supervisors });
  return res.json({message: "Supervisors list updated successfully."});
};

/**
 * Add a supervisor by their email address. Currently only allows existing users
 * to be added.
 */
exports.addSupervisor = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (!req.body.supervisor)
    throw new InvalidParametersError("Please provide a supervisor email address.");
  const assignment = await assignmentModel.findById(req.params.assignment);
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
    { _id: req.params.assignment, },
    { $addToSet: { supervisors: user._id }},
  );
  return res.json({ message: successMessage });
};

exports.bulkAddSupervisors = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (!req.body.supervisors || !Array.isArray(req.body.supervisors))
    throw new InvalidObjectIdError("Please provide a list of supervisor emails.");
  if (!req.body.supervisors.every(isValidEmail))
    throw new InvalidParametersError("Some of the email addresses provided were invalid.");
  const supervisorIDs = await userModel.findOrPlaceholderBulk(req.body.supervisors.map(u => ({email: u, displayName: u})));
  // Check that none of these people are already registered as staff/students
  const assignment = await assignmentModel.findById(req.params.assignment);
  const staffList = assignment.lecturers.map(s => s.toString());
  const studentsList = assignment.students.map(s => s.toString());
  const staffStudentsList = new Set(staffList.concat(studentsList));
  const crossovers = supervisorIDs.map(toString).filter(e => staffStudentsList.has(e));
  if (crossovers.length > 0)
    throw new InvalidParametersError("Some of the users provided are either staff or students on this assignment, and can't become supervisors.");
  // No crossovers, so safe to add
  await assignmentModel.updateOne(
    { _id: req.params.assignment, },
    { $addToSet: { supervisors: { $each: supervisorIDs } }},
  );
  return res.json({ message: `${supervisorIDs.length} supervisors have been added.` });
};

exports.changeSupervisorTeams = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (!Types.ObjectId.isValid(req.params.supervisor))
    throw new InvalidObjectIdError("The provided supervisor ID is invalid.");
  if (!req.body.teams || !Array.isArray(req.body.teams))
    throw new InvalidObjectIdError("Please provide a list of teams.");
  // Make sure the supervisor is listed on the module
  const assignment = await assignmentModel.findOne({ _id: req.params.assignment, supervisors: req.params.supervisor });
  if (!assignment)
    throw new GenericNotFoundError("That person isn't listed as a supervisor on the module. Please refresh and try again.");
  // Check that the teams are valid and from this assignment
  const teamIds = req.body.teams.map(id => new Types.ObjectId(id));
  const teams = await teamModel.find({_id: { $in: teamIds }, assignment: req.params.assignment }).select("_id").lean();
  if (teams.length !== req.body.teams.length)
    throw new InvalidParametersError("Some of the teams selected weren't valid. Please try again.");
  // Remove them from any teams they currently supervise for this assignment
  await teamModel.updateMany(
    { assignment: req.params.assignment, supervisors: req.params.supervisor, },
    { $pull: { supervisors: req.params.supervisor }},
  );
  await teamModel.updateMany(
    { assignment: req.params.assignment, _id: { $in: teamIds }, },
    { $addToSet: { supervisors: req.params.supervisor }},
  );
  return res.json({ message: "Supervisor teams updated successfully."});
};

exports.removeSupervisor = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  if (!Types.ObjectId.isValid(req.params.supervisor))
    throw new InvalidObjectIdError("The provided supervisor ID is invalid.");
  await teamModel.updateMany(
    { assignment: req.params.assignment, supervisors: req.params.supervisor, },
    { $pull: { supervisors: req.params.supervisor }},
  );
  await assignmentModel.updateOne(
    { _id: req.params.assignment },
    { $pull: { supervisors: req.params.supervisor }},
  );
  return res.json({ message: "Supervisor removed successfully."});
};
