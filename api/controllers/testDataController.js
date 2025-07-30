const assignmentModel = require("../models/assignment");
const userModel = require("../models/user");
const teamModel = require("../models/team");
const meetingModel = require("../models/meeting");
const checkinModel = require("../models/checkin");
const { Types } = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateHash } = require("../utility/auth");
const { testStudentIds, testAssignment1, testAssignment2, testMeetings, testMeetingMinutes, testMeetingActions } = require("../models/testdata");
const { generateRandomString } = require("../utility/maths");
const { emailsReady, emailTransporter, sendGenericEmail } = require("../utility/emails");
const { ConfigurationError, InvalidParametersError, GenericNotFoundError } = require("../errors/errors");
const { SMTP_FROM_ADDRESS } = process.env;

/*
  For the given assignment and skill tag, randomises the student skill ratings.
  Useful for generating a class of data to work with for testing purposes. Also
  randomises their averageMarks to roughly correspond to their skill ratings.
*/
exports.randomiseSkillRatings = async (req, res) => {
  if (!Types.ObjectId.isValid(req.query.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.query.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
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
  return res.json({
    message: `Skills ratings updated for ${assignment.students.length} students.`,
  });
};

// Rework, don't submit as-is
exports.addRandomStudents = async (req, res) => {
  // Check assignment
  if (!Types.ObjectId.isValid(req.query.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.query.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }

  const numToGenerate = req.query.count ?? 30;

  const students = [];
  const passwordHash = "$2a$12$RzGL1/0kKn4pA3rGhjXGcOI19PFBEN3cIrDOsxNARYhe9wItDItF2";

  const firstNames = {
    male: ["Johnny", "Kelvin", "Olly", "Martin", "Edward", "Brett", "Aaron", "Adrian", "Kenny", "Chris", "Aidan", "Jeremy", "Kieran", "Francesco", "Mel", "Dean", "Matt", "Felix", "Roberto", "Christopher", "Mike", "Tristan", "Marc", "Kieron", "Antonio", "Nathaniel", "Adam", "Scott", "Francis", "Murray", "Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas", "Henry", "Alexander", "Daniel", "Joseph", "Samuel", "David", "Jacob", "Logan", "Owen", "Dylan", "Ethan", "Caleb"],
    female: ["Issie","Madeline","Kathryn","Kate","Catherine","Emily","Poppy","Harriet","Katie","Rebecca","Bernadette","Stacey","Danielle","Sophia","Tara","Gina","Elsie","Nicki","Vikki","Dionne","Ava","Susan","Marina","Barbara","Amelia","Isla","Daisy","Stephanie","Katherine","Megan"],
    other: ["Alex", "Jamie", "River", "Morgan", "Taylor", "Avery", "Skylar", "Casey", "Quinn", "Dakota"],
  };
  const lastNames = ["Smith", "Jones", "Williams", "Brown", "Taylor", "Davies", "Wilson", "Johnson", "Roberts", "Green", "Hall", "Thomas", "Thompson", "Jackson", "White", "Harris", "Martin", "Clark", "Lewis", "Lee", "Walker", "Perez", "King", "Wright", "Scott", "Baker", "Adams", "Nelson", "Carter", "Mitchell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Morris", "Murphy", "Cook", "Rogers", "Morgan", "Bell", "Bailey", "Kelly", "Howard", "Ward", "Cox", "Bennett", "Wood", "Watson", "Gray", "Shaw", "Murray"];
  const usernameNumber = Math.floor(Math.random() * 100);

  const maleWeighting = 0.8;

  for (let i=0; i<numToGenerate; i++) {
    var gender;
    var firstName;
    if (Math.random() < 0.05) {
      gender = "other";
      firstName = firstNames.other[Math.floor(Math.random() * firstNames.other.length)];
    } else if (Math.random() < maleWeighting) {
      gender = "male";
      firstName = firstNames.male[Math.floor(Math.random() * firstNames.male.length)];
    } else {
      gender = "female";
      firstName = firstNames.female[Math.floor(Math.random() * firstNames.female.length)];
    }
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const international = Math.random() < 0.2;
    let meetingPref;
    if (Math.random() < 0.6) {
      meetingPref = "either";
    } else if (Math.random() < 0.5) {
      meetingPref = "in-person";
    } else {
      meetingPref = "online";
    }

    const assignment = await assignmentModel
      .findById(req.query.assignment)
      .select("skills");
    const skillNames = assignment?.skills?.map((skill) => skill.name) ?? [];

    const email = `${firstName.toLowerCase()}-${lastName.charAt(0).toLowerCase()}-${usernameNumber}@example.com`;
    const baseSkill = Math.floor(Math.random() * 5) + 2;
    const variance = Math.floor(Math.random() * 3) - 1;
    // Small chance of completely random skill scores
    var skills = {};
    skillNames.forEach(skill => {
      if (Math.random() < 0.1) {
        // Completely random skill rating
        skills[skill] = Math.floor(Math.random() * 7) + 1;
      } else {
        // Normally, a slight variation on the base skill
        skills[skill] = Math.max(1, Math.min(7, baseSkill + Math.floor(Math.random() * 2) - 1));
      }
    });

    const averageMark = Math.floor(Math.random() * 35) + 35 + (baseSkill * 3);
    const comp1234Mark = Math.floor(Math.random() * 35) + 35 + (baseSkill * 3);

    students.push({
      displayName: firstName + " " + lastName,
      gender,
      email,
      role: "student",
      passwordHash,
      skills,
      international,
      marks: {
        overall: averageMark,
        comp1234: comp1234Mark,
      },
      meetingPref,
    });
  }

  const inserted = await userModel.insertMany(students);
  const insertedIds = inserted.map(s => s._id);
  await assignmentModel.addStudents(req.query.assignment, insertedIds);

  return res.json(insertedIds);

};

exports.addRandomCheckins = async (req, res) => {
  // Check assignment
  if (!Types.ObjectId.isValid(req.query.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.query.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
  const weeksToFill = 5;
  // Get teams on this assignment
  const teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment) }).lean();
  const checkInPeriodDate = new Date();
  checkInPeriodDate.setDate(checkInPeriodDate.getDate() - 7 * weeksToFill);
  // Add batches of check-in data
  for (let i=0; i<weeksToFill; i++) {
    // Fill in check-ins for this week
    teams.forEach(async (team) => {
      const checkin = await checkinModel.createNewCheckin(team._id, checkInPeriodDate);
      checkin.effortPoints = {};
      const modeRandomiser = Math.random();
      const lowEffortStudent = 1; // Makes data more consistent on the line chart
      const underEffort = Math.floor(Math.random() * 3) + 1;
      team.members.forEach(member => {
        let effortPoints = team.members.reduce((acc, id) => ({ ...acc, [id]: 4 }), {});
        const randomOtherStudent = Math.floor(Math.random() * team.members.length);
        if (modeRandomiser < 0.3 && member != team.members[lowEffortStudent]) {
          const myExtraPoints = Math.floor(Math.random() * (underEffort + 1));
          effortPoints[team.members[lowEffortStudent]] -= underEffort;
          effortPoints[member] += myExtraPoints;
          effortPoints[team.members[randomOtherStudent]] += Math.max(0, underEffort - myExtraPoints);
        } else if (modeRandomiser < 0.6) {
          const myExtraPoints = Math.floor(Math.random() * 3);
          effortPoints[member] += myExtraPoints;
          effortPoints[team.members[randomOtherStudent]] -= myExtraPoints;
        }
        checkin.effortPoints[member] = effortPoints;
      });
      await checkin.save();
    });
    checkInPeriodDate.setDate(checkInPeriodDate.getDate() + 7);
  }
  return res.json({message: `Added random checkins for ${teams.length} teams.`});
};

exports.addRandomMeetings = async (req, res) => {
  // Check assignment
  if (!Types.ObjectId.isValid(req.query.assignment))
    return res.status(400).json({ message: "Invalid assignment ID." });
  if (
    !(await assignmentModel.isUserOnAssignment(
      req.query.assignment,
      req.session.userId,
      "lecturer",
    ))
  ) {
    return res.status(404).json({
      message:
        "The assignment is unknown or you are not registered as a lecturer on it.",
    });
  }
  // Get teams on this assignment
  const teams = await teamModel.find({ assignment: new Types.ObjectId(req.query.assignment) }).lean();
  teams.forEach(async (team) => {
    const meetingCount = Math.floor(Math.random() * 4);
    // Randomise the first meeting date
    // Generated meetings will be weekly
    let meetingDate = new Date();
    meetingDate.setHours(13);
    meetingDate.setMinutes(30);
    meetingDate.setDate(meetingDate.getDate() - 7 * meetingCount + Math.floor(Math.random() * 7));
    let previousActions = [];
    for (let i=0; i<meetingCount; i++) {
      const attendanceMode = Math.random();
      const meeting = {};
      meeting.discussion = testMeetingMinutes[i];
      if (attendanceMode < 0.7) {
        // Everyone attended
        meeting.attendance = { attended: team.members };
      } else if (attendanceMode < 0.9) {
        // OK-ish attendance
        meeting.attendance = {
          apologies: team.members.slice(0, 2),
          attended: team.members.slice(2),
        };
      } else {
        // Bad attendance
        meeting.attendance = {
          attended: team.members.slice(0, 3),
          absent: team.members.slice(3),
        };
      }
      const attendees = meeting.attendance.attended;
      meeting.location = "100/3011";
      meeting.dateTime = meetingDate;
      meeting.minuteTaker = meeting.attendance.attended[0];
      meeting.team = team;
      // Add some actions
      meeting.previousActions = previousActions.map(a => {
        const complete = Math.random() < 0.7;
        return {...a, complete};
      });
      meeting.newActions = meeting.previousActions.filter(a => !a.complete).map(a => a);
      const addedActions = testMeetingActions.slice(i*3, (i+1)*3).map(a => {
        const assignee = attendees[Math.floor(Math.random() * attendees.length)];
        return { action: a, assignees: [assignee], complete: false, };
      });
      meeting.newActions.push(...addedActions);
      previousActions = addedActions;
      await meetingModel.create(meeting);
      meetingDate.setDate(meetingDate.getDate() + 7);
    }
  });
  return res.json({message: `Added random meetings for ${teams.length} teams.`});
};

/*
  Create a temporary lecturer account for user testing. Not to be used with real
  data. Provide the tester's name in the ?name query string parameter. Provide
  the Qualtrics response ID in the ?id parameter.
*/
exports.provisionTemporaryLecturer = async (req, res) => {
  if (!req.query.id) return res.status(401).send("Qualtrics response ID missing. Please return to the survey and follow the link again.");
  const displayName = req.query.name ?? "Dr. Amy Testing";
  const email = `${req.query.id}@l.example.org`;
  const passwordHash = await generateHash(email);
  // Delete any existing users with this ID
  await userModel.deleteMany({email});
  // Insert the user record into the database
  const createdUser = await userModel.create({
    email, displayName, passwordHash, role: "lecturer",
  });
  // Start a session for the tester
  req.session.userId = createdUser._id;
  req.session.email = createdUser.email;
  req.session.role = createdUser.role;
  // Create dummy assignments for the tester
  const assignment1 = await assignmentModel.create({
    ...testAssignment1, lecturers: [createdUser._id], students: [],
  });
  // const studentIds = [...testStudentIds, createdUser._id];
  // const assignment2 = await assignmentModel.create({
  //   ...testAssignment2, students: studentIds,
  // });
  // const team = await teamModel.create({
  //   assignment: assignment2._id,
  //   teamNumber: 1,
  //   members: studentIds,
  // });
  // await meetingModel.create(testMeetings(team._id, studentIds));
  return res.redirect("/login/refresh");
};

exports.provisionTemporaryStudent = async (req, res) => {
  if (!req.query.id) return res.status(401).send("Qualtrics response ID missing. Please return to the survey and follow the link again.");
  const displayName = req.query.name ?? "Alice Test";
  let email;
  if (req.query.id === "random") {
    email = `${generateRandomString(10)}@s.example.org`;
  } else {
    email = `${req.query.id}@s.example.org`;
  }
  const passwordHash = await generateHash(email);
  // Delete any existing users with this ID
  await userModel.deleteMany({email});
  // Insert the user record into the database
  const createdUser = await userModel.create({
    email, displayName, passwordHash, role: "student",
  });
  // Start a session for the tester
  req.session.userId = createdUser._id;
  req.session.email = createdUser.email;
  req.session.role = createdUser.role;
  // Create dummy assignments for the tester
  const assignment1 = await assignmentModel.create({
    ...testAssignment1, students: [createdUser._id],
  });
  const studentIds = [...testStudentIds, createdUser._id];
  const assignment2 = await assignmentModel.create({
    ...testAssignment2, students: studentIds,
  });
  const team = await teamModel.create({
    assignment: assignment2._id,
    teamNumber: 1,
    members: studentIds,
  });
  await meetingModel.create(testMeetings(team._id, studentIds));
  return res.redirect("/login/refresh");
};

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
    replyToEmail: "S.Kitson@soton.ac.uk",
  });
  return res.json({ message: `Sent email to ${req.query.email}.` });
};
