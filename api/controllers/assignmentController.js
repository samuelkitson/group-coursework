const assignmentModel = require("../models/assignment");
const { Types } = require("mongoose");

exports.createAssignment = async (req, res) => {
  if (!req.body.name)
    return res.status(400).json({ message: "You must provide an assignment name." });
  if (!req.body.description)
    return res.status(400).json({ message: "You must provide an assignment description." });
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
  if (!Types.ObjectId.isValid(req.params.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.params.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
  await assignmentModel.deleteOne({_id: new Types.ObjectId(req.params.assignment)});
  return res.json({message: "Assignment deleted successfully"});
};

exports.updateAssignmentInfo = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (!req.body.name)
    return res.status(400).json({ message: "You must provide an assignment name." });
  if (!req.body.description)
    return res.status(400).json({ message: "You must provide an assignment description." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.params.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
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
  // Check whether to use student or lecturer filtering
  if (req.session.role == "student") {
    const dbAssignments = await assignmentModel.findByStudent(
      req.session.userId,
      false,
    );
    return res.json(dbAssignments);
  } else if (req.session.role == "lecturer") {
    const dbAssignments = await assignmentModel.findByLecturer(
      req.session.userId,
      true,
    );
    return res.json(dbAssignments);
  } else {
    res.status(403).json({
      message:
        "Your account role is invalid. Please log out and back in again.",
    });
  }
};

exports.getEnrolledStudents = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.params.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
  const studentsList = await assignmentModel.getStudents(req.params.assignment);
  return res.json(studentsList?.students);
};

exports.getSkills = async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.params.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
  const skills = await assignmentModel.findById(req.params.assignment).select("skills");
  return res.json(skills);
};

exports.setSkills = async (req, res) => {
  // Get and check permissions on the assignment object
  if (!Types.ObjectId.isValid(req.params.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.params.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
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
  // Get and check permissions on the assignment object
  if (!Types.ObjectId.isValid(req.params.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.params.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
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
