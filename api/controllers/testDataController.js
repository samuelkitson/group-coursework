const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const { Types } = require("mongoose");
const { emailsReady, sendGenericEmail } = require("../utility/emails");
const { ConfigurationError, InvalidParametersError, GenericNotFoundError, InvalidObjectIdError, AuthenticationError } = require("../errors/errors");

/*
  For the given assignment and skill tag, randomises the student skill ratings.
  Useful for generating a class of data to work with for testing purposes. Also
  randomises their averageMarks to roughly correspond to their skill ratings.
*/
/**
 * TESTING - ADMINS ONLY
 * Used for testing purposes only. Provide an assignment ID in the assignment
 * query parameter and the system will randomise all of the skill ratings for
 * the students on that assignment.
 */
exports.randomiseSkillRatings = async (req, res) => {
  if (!Types.ObjectId.isValid(req.query.assignment))
    throw new InvalidObjectIdError("Unknown assignment ID.");
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.query.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return AuthenticationError("You must be registered as an admin on the assignment.");
  }
  // Randomise skills data for these students
  const assignment = await assignmentModel
    .findById(req.query.assignment)
    .select("students skills");
  const skillNames = assignment?.skills?.map((skill) => skill.name) ?? [];
  assignment.students.forEach(async (studentId) => {
    const student = await userModel.findById(new Types.ObjectId(studentId));
    const baseSkill = Math.floor(Math.random() * 7) + 1;
    if (student["skills"] == undefined) student["skills"] = {};
    skillNames.forEach(skill => {
      if (Math.random() < 0.1) {
        // Completely random skill rating
        student["skills"].set(skill, Math.floor(Math.random() * 7) + 1);
      } else {
        // Normally, a slight variation on the base skill
        student["skills"].set(skill, Math.max(1, Math.min(7, baseSkill + Math.floor(Math.random() * 2) - 1)));
      }
    });
    let averageMark = Math.floor(Math.random() * 35) + 35;
    averageMark = averageMark + baseSkill * 3;
    if (student.marks == undefined) student.marks = new Map();
    student.marks.set("overall", averageMark);
    await student.save();
  });
  return res.json({ message: `Skills ratings updated for ${assignment.students.length} students.` });
};

/**
 * TESTING - ADMINS ONLY
 * This endpoint can be used to send a test email from the system. It should be
 * used solely to check whether email sending is correctly configured. Provide
 * the email address of a registered user in the email query parameter.
 */
exports.sendTestEmail = async (req, res) => {
  if (!req.query.email)
    throw new InvalidParametersError("You must provide a recipient email address.");
  const emailsReadyFlag = await emailsReady;
  if (!emailsReadyFlag)
    throw new ConfigurationError("Email sending is not configured correctly.");
  const user = await userModel.findOne({email: req.query.email}).select("displayName").lean();
  if (!user)
    throw new GenericNotFoundError("The provided email address is not a known user.");
  sendGenericEmail({
    recipientEmail: req.query.email,
    recipientName: user.displayName,
    subject: "Group Courseworks - Test",
    headerText: "Test email",
    bodyText: "This is a test of the Group Coursework email system. If you can read this, it worked!<br />You don't need to do anything else and you can safely delete this email.",
    replyToEmail: req.session.email,
  });
  return res.json({ message: `Sent email to ${req.query.email}.` });
};
