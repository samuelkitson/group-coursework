const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const { Types } = require("mongoose");
const { checkAssignmentRole } = require("../utility/auth");
const { InvalidParametersError, IncorrectRoleError, AssignmentInvalidStateError } = require("../errors/errors");
const { questionnaireAvailableEmail, newLecturerExistingEmail } = require("../utility/emails");
const { setDifference } = require("../utility/maths");

exports.createAssignment = async (req, res) => {
  if (req.session.role === "student")
    throw new IncorrectRoleError("Students cannot create new assignments.");
  if (!req.body.name)
    throw new InvalidParametersError("You must provide an assignment name.");
  if (!req.body.description)
    throw new InvalidParametersError("You must provide an assignment description.");
  // If ASSIGNMENTS_ADMIN_LOCK is set, only allow admins to create assignments
  if (process.env?.ASSIGNMENTS_ADMIN_LOCK === "true" && req.session.role !== "admin")
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
  const assignment = await assignmentModel.findById(req.params.assignment);
  if (!["pre-allocation"].includes(assignment?.state) && !req.query.force) {
    throw new InvalidParametersError("Please confirm your intentions first.");
  }
  await assignmentModel.findByIdAndDelete(req.params.assignment);
  return res.json({message: "Assignment deleted."});
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
  if (newState !== "pre-allocation" && assignment?.students?.length == 0)
    throw new AssignmentInvalidStateError("You need to add some students first.");
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
    throw new InvalidParametersError("Selected state is invalid.");
  }
  if (existingState === newState)
    throw new InvalidParametersError("You can't move to the current state.");
  // Check valid state moves one-by-one.
  var changeAllowed = false;
  var message = null;
  if (newState === "pre-allocation") {
    if (forceMove) {
      changeAllowed = true;
      message = "Reset to the initial state."
    }
  } else if (newState === "allocation-questions") {
    if (existingState === "pre-allocation") {
      changeAllowed = true;
      message = "Allocation questionnaire opened to students.";
    } else if (forceMove) {
      changeAllowed = true;
      message = "Allocation questionnaire re-opened."
    }
  } else if (newState === "allocation") {
    if (existingState === "allocation-questions") {
      changeAllowed = true;
      message = "Allocation questionnaire closed. Time to allocate teams!";
    } if (existingState === "pre-allocation" && assignment?.skills?.length == 0) {
      changeAllowed = true;
      message = "Questionnaire skipped. Time to allocate teams!";
    } else if (forceMove) {
      changeAllowed = true;
      message = "Allocation reset. All teams have been deleted.";
    }
  } else if (newState === "live") {
    if (existingState === "closed" && forceMove) {
      changeAllowed = true;
      message = "Assignment re-opened.";
    }
  } else if (newState === "closed") {
    if (existingState === "live") {
      changeAllowed = true;
      message = "Assignment has been closed.";
    }
  }
  // Check whether the change was allowed or now.
  if (!changeAllowed) {
    throw new InvalidParametersError("You can't move the assignment to that state.");
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
  const users = await userModel.find({_id: { $in: staffIds }, role: { $in: ["staff", "admin"] }}).select("_id email displayName").lean();
  if (users.length !== staffIds.length)
    throw new InvalidParametersError("Some of the staff members selected either haven't logged in before, or are listed as students.");
  const assignment = await assignmentModel.findById(req.params.assignment);
  const previousStaff = new Set(assignment.lecturers.map(l => l.toString()));
  const addedStaff = setDifference(new Set(req.body.staff), previousStaff);
  assignment.lecturers = staffIds;
  await assignment.save();
  // Send alert emails to staff.
  for (const lecturer of users) {
    if (addedStaff.has(lecturer._id.toString())) {
      newLecturerExistingEmail({
        newStaffEmail: lecturer.email,
        newStaffName: lecturer.displayName,
        staffUserEmail: req.session.email, 
        assignmentName: assignment.name, 
        assignmentId: assignment._id,
      });
    }
  }
  if (addedStaff.size > 0) {
    return res.json({message: `${addedStaff.size} new staff member${addedStaff.size == 1 ? " has" : "s have"} been added and alerted by email.`});
  } else {
    return res.json({message: "Assignment staff list updated successfully."});
  }
};
