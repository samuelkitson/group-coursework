const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");
const { mongoose } = require("../config/db");
const { Types } = require("mongoose");
const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const { checkAssignmentRole } = require("../utility/auth");
const { InvalidParametersError, CustomError, InvalidObjectIdError, InvalidFileError, AssignmentInvalidStateError } = require("../errors/errors");
const { setDifference } = require("../utility/maths");
const { ALLOWED_EMAIL_DOMAINS } = process.env;

// Provide a list of allowed emails domains as a comma separated list
const allowedDomains = ALLOWED_EMAIL_DOMAINS?.split(",") ?? [];

/*
  Allows staff to upload a CSV of student data from which to create new users.
  If an assignment ID is provided in the assignment body field, the users will
  automatically be added to that assignment after creation. If users with the
  supplied email addresses already exist, they'll be ignored (but still added to
  the assignment if necessary). 
*/
exports.enrolStudentsOnAssignment = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  const assignment = await assignmentModel.findById(req.body.assignment);
  const existingStudents = new Set(assignment.students.map(s => s.toString()));
  if (assignment.state === "closed")
    return AssignmentInvalidStateError();
  if (assignment.state === "live" && !["new", "existing"].includes(req.body?.mode))
    return InvalidParametersError("Please choose either \"existing groups\" or \"new groups\".");
  if (!req.file)
    return InvalidParametersError("You need to upload a valid CSV file of student data first.");
  try {
    // Attempt to load and parse the CSV.
    const parsePromise = new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(req.file.path);
      Papa.parse(fileStream, {
        header: true,
        transform: (value) => (value === "" ? null : value),
        complete: (results) => {
          resolve({ parsedData: results.data, headers: results.meta.fields });
        },
        error: (err) => {
          console.warn(`Dataset upload error: ${err.message}`);
          reject(new InvalidFileError("The uploaded file was not valid. Please check the requested format and try again."));
        },
      });
    });
    // Check whether all of the required attributes are present.
    const { headers, parsedData } = await parsePromise;
    const missingCols = Array.from(setDifference(new Set(["email", "name"]), new Set(headers)));
    if (missingCols.length > 0)
      throw new InvalidFileError(`CSV is missing some required columns: ${missingCols.join(", ")}.`);
    const newStudents = [];
    const newEmails = [];
    const studentIds = [];
    // Iterate through the list of students.
    for (const row of parsedData) {
      if (!row.email && !row.name) {
        // Skip empty row
        continue;
      }
      if (!row.email || !row.name) {
        // Row contains invalid or missing data, cancel operation.
        throw new InvalidParametersError("Invalid row data (missing either email or name).");
      }
      // First check if their email domain is allowed.
      const domain = row.email.split("@")[1];
        if (!allowedDomains.includes(domain)) throw new InvalidParametersError(`${row.email} is not a permitted email domain.`);
      if (newEmails.includes(row.email)) {
        throw new InvalidParametersError("The CSV file contains duplicate email addresses.");
      }
      // Check whether this user's email already exists (in which case just add them to the assignment).
      const existingStudent = await userModel.findOne(
        { email: row.email },
      );
      newEmails.push(row.email);
      if (existingStudent) {
        // User exists, so just record that we need to add them to assignment.
        studentIds.push(existingStudent._id);
      } else {
        // Student doesn't exist, so create a new document for them.
        // As no password hash is set, they will only be able to log in via MS.
        const newStudentId = new Types.ObjectId();
        const displayName = row?.name ?? row.email;
        newStudents.push({
          email: row.email,
          _id: newStudentId,
          displayName,
          role: "placeholder",
          meetingPref: "either",
        });
        studentIds.push(newStudentId);
      }
    }
    // Create new student documents.
    await userModel.insertMany(newStudents);
    await assignmentModel.addStudents(req.body.assignment, studentIds);
    // If the assignment is already live, these new students need to be added to
    // teams according to the provided mode. This involves either adding them to
    // existing groups (smallest first) or adding them all to one new group.
    const actualNewIds = setDifference(new Set(studentIds.map(s => s.toString())), existingStudents);
    if (actualNewIds.size > 0 && req.body.mode) {
      if (req.body.mode === "new") {
        // Add to new team.
        const existingTeamsCount = await teamModel.countDocuments({ assignment: req.body.assignment });
        const newTeam = await teamModel.create({
          assignment: req.body.assignment,
          teamNumber: existingTeamsCount + 1,
          members: Array.from(actualNewIds)
        });
        return res.json({ message: `${studentIds.length} students added to Team ${newTeam.teamNumber}.` });
      } else {
        // Add to existing teams. Ignore any without members already.
        const existingTeams = (await teamModel.find({ assignment: req.body.assignment }).select("_id members").lean()).filter(t => t.members.length > 0);
        if (existingTeams.length == 0) return InvalidParametersError("There are no existing teams to add the students to.");
        for (const newStudent of actualNewIds) {
          // First sort the list so we add the student to the current smallest team.
          existingTeams.sort((a, b) => a.members.length - b.members.length);
          await teamModel.updateOne({ _id: existingTeams[0]._id }, { $addToSet: { members: new Types.ObjectId(newStudent), }});
          existingTeams[0].members.push(newStudent);
        }
        return res.json({ message: `${studentIds.length} students added to existing teams.`, students: studentIds });
      }
    } else {
      return res.json({ message: `${studentIds.length} students added successfully.`, students: studentIds });
    }
  } finally {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error(`Failed to delete uploaded student list: `, err.message);
    });
  }
};

exports.removeFromAssignment = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  // Get and check permissions on the assignment object
  if (!Types.ObjectId.isValid(req.body.student))
    throw new InvalidObjectIdError("The provided student ID is invalid.");
  // Get assignment object
  await assignmentModel.removeStudent(req.body.assignment, req.body.student);
  // Also remove the student from their teams if applicable
  await teamModel.findOneAndUpdate(
    { assignment: req.body.assignment, members: { $in: [req.body.student] }},
    { $pull: { members: req.body.student }},
  )
  return res.json({ message: "Student removed from assignment." });
};

exports.removeAllFromAssignment = async (req, res) => {
  await checkAssignmentRole(req.body.assignment, req.session.userId, "lecturer");
  // Get and check permissions on the assignment object.
  // Get assignment object.
  const assignment = await assignmentModel.findById(req.body.assignment);
  if (assignment.state !== "pre-allocation")
    throw new AssignmentInvalidStateError();
  assignment.students = [];
  await assignment.save();
  return res.json({ message: "All students removed." });
};

exports.setPairingExclusions = async (req, res) => {
  if (!Types.ObjectId.isValid(req.body.student))
    throw new InvalidObjectIdError("The provided student ID is invalid.");
  if (!req.body.others || !Array.isArray(req.body.others))
    throw new InvalidParametersError("You must provide a valid list of other student IDs.");
  if (req.body.others.includes(req.body.student)) {
    throw new InvalidParametersError("You can't add a student to their own exclusions list.");
  }
  // Get current exclusions for the student so they can be removed
  const student = await userModel.findById(req.body.student);
  const studentId = new Types.ObjectId(req.body.student);
  const previousExclusions = student?.noPair ?? [];
  // Remove previous exclusions
  const updatePromises = previousExclusions.map((otherStudent) => {
    return userModel.findOneAndUpdate(
      { _id: otherStudent },
      { $pull: { noPair: studentId } },
    );
  });
  const results = await Promise.all(updatePromises);
  const updated = results.every(doc => doc !== null);
  if (!updated)
    throw new InvalidObjectIdError("One or more of the students in the exclusion list couldn't be found. Please reload and try again.");
  // Add new exclusions
  student.noPair = req.body.others;
  const othersPromises = req.body.others.map((otherStudent) => {
    return userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(otherStudent) },
      { $addToSet: { noPair: studentId } },
    );
  });
  await Promise.all(othersPromises);
  await student.save();
  return res.json({ message: "Updated pairing exclusions." });
};

exports.getProfile = async (req, res) => {
  const profile = await userModel.findOne(
    { _id: new Types.ObjectId(req.session.userId), },
    "email displayName role meetingPref bio",
  );
  return res.json({ profile: profile });
}; 

exports.updateOwnProfile = async (req, res) => {
  await userModel.findOneAndUpdate(
    { _id: new Types.ObjectId(req.session.userId), },
    { meetingPref: req.body?.meetingPref, bio: req.body?.bio },
  );
  return res.json({ message: "Profile updates saved." });
};
