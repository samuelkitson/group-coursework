const fs = require("fs");
const csvParser = require("csv-parser");
const { mongoose } = require("../config/db");
const { Types } = require("mongoose");

const userModel = require("../models/user");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const { generateHash, checkAssignmentRole } = require("../utility/auth");
const { InvalidParametersError, CustomError, InvalidObjectIdError } = require("../errors/errors");

/*
  Allows staff to upload a CSV of student data from which to create new users.
  If an assignment ID is provided in the assignment body field, the users will
  automatically be added to that assignment after creation. If users with the
  supplied email addresses already exist, they'll be ignored (but still added to
  the assignment if necessary). 
*/
exports.upload = async (req, res) => {
  if (!req.file)
    return InvalidParametersError("You need to upload a valid CSV file of student data first.");

  const studentsList = [];
  var targetAssignment = req.body.assignment;
  if (targetAssignment != null && targetAssignment !== "") {
    // If target assignment is defined, check it actually exists and this user is a lecturer on it
    await checkAssignmentRole(targetAssignment, req.session.userId, "lecturer");
  } else {
    targetAssignment = null;
  }

  // Open and parse the CSV file
  // Required fields: email, name
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row) => studentsList.push(row))
    .on("end", async () => {
      try {
        const newStudents = [];
        const studentIds = [];
        // Iterate through the list of students
        for (const row of studentsList) {
          if (!row.email || !row.displayName) {
            // Row contains invalid or missing data, cancel operation
            throw new InvalidParametersError("Invalid row data (missing either email or name)");
          }
          // Extract all the fields other than _id and performance data
          let studentDataFields = {};
          studentDataFields.displayName = row?.displayName ?? undefined;
          // Check whether this user's email already exists (in which case just add them to the assignment)
          const existingStudent = await userModel.findOne(
            { email: row.email },
          );
          if (existingStudent) {
            studentIds.push(existingStudent._id);
            // Update the student details
            await userModel.updateOne({ email: row.email }, { $set: studentDataFields });
          } else {
            // Student doesn't exist, so create a new document for them
            const newStudentId = new Types.ObjectId();
            // const passwordHash = await generateHash(row.email);
            const passwordHash = undefined;
            newStudents.push({
              ...studentDataFields,
              email: row.email,
              _id: newStudentId,
              passwordHash: passwordHash,
              role: "student",
              meetingPref: "either",
            });
            studentIds.push(newStudentId);
          }
        }
        // Create new student documents
        await userModel.insertMany(newStudents);
        // If required, add the students to the assignment
        if (targetAssignment) {
          await assignmentModel.addStudents(targetAssignment, studentIds);
        }
        res.json({ message: "File uploaded successfully" });
      } catch (error) {
        // Something failed - probably malformed CSV - so abort
        console.error("Error importing student CSV: " + error.message);
        throw new CustomError("An error occurred processing your CSV. Please check the format and try agai.");
      } finally {
        // Delete the temporary CSV file
        fs.unlink(req.file.path, () => {});
      }
    });
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
  previousExclusions.forEach(async (otherStudent) => {
    const updated = await userModel.findOneAndUpdate(
      { _id: otherStudent },
      { $pull: { noPair: studentId } },
    );
    if (!updated) {
      throw new InvalidObjectIdError("One or more of the students in the exclusion list couldn't be found. Please reload and try again.");
    }
  });
  // Add new exclusions
  student.noPair = req.body.others;
  req.body.others.forEach(async (otherStudent) => {
    await userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(otherStudent), },
      { $addToSet: { noPair: studentId } },
    );
  });
  await student.save();
  return res.json({message: "Updated pairing exclusions."});
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
