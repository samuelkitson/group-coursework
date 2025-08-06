const Papa = require("papaparse");
const fs = require("fs");
const { AllocationAlgorithm } = require("../algorithm/algorithm");
const { criteriaOptions, criteriaOptionsMap, dealbreakerOptions, dealbreakerOptionsMap } = require("../models/allocationOptions");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const { Types } = require("mongoose");
const { checkAssignmentRole } = require("../utility/auth");
const { AssignmentInvalidStateError, InvalidParametersError, InvalidFileError } = require("../errors/errors");
const { teamsReleasedStudentEmail } = require("../utility/emails");
const { setDifference } = require("../utility/maths");

const findTeamMates = async (studentIds, includePast=false) => {
  const result = {};
  // Get a list of the relevant assignments
  let assignmentsFilter;
  if (includePast) {
    assignmentsFilter = { $in: ["live", "closed"] };
  } else {
    assignmentsFilter = "live";
  }
  const assignments = await assignmentModel.find({ state: assignmentsFilter }, "_id").lean();
  // Find teammates for each student
  for (const studentId of studentIds) {
    // Get teams that this student is in for the relevant assignments
    const otherTeams = await teamModel.find({ assignment: { $in: assignments }, members: studentId }, "members").lean();
    let otherTeamMembers = otherTeams.flatMap(team => team.members.map(s => s.toString()));
    const deDupOtherMembers = [...new Set(otherTeamMembers.filter(id => id != studentId))];
    result[studentId.toString()] = deDupOtherMembers;
  }
  return result;
};

exports.getAllocationOptions = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const assignment = await assignmentModel.findById(req.params.assignment).select("skills");
  return res.json({
    "criteria": criteriaOptions,
    "dealbreakers": dealbreakerOptions,
    "skills": assignment?.skills,
  })
};

exports.getAllocationSetup = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const assignment = await assignmentModel.findById(req.params.assignment).select("allocationCriteria allocationDealbreakers groupSize surplusLargerGroups").lean();
  fullCriteria = assignment.allocationCriteria?.map(criterion => {
    const fullCriterion = criteriaOptionsMap.get(criterion.name);
    if (fullCriterion) {
      return { ...fullCriterion, ...criterion };
    }
    return criterion;
  }) ?? [];
  fullDealbreakers = assignment.allocationDealbreakers?.map(dealbreaker => {
    const fullDealbreaker = dealbreakerOptionsMap.get(dealbreaker.name);
    if (fullDealbreaker) {
      return { ...fullDealbreaker, ...dealbreaker };
    }
    return dealbreaker;
  }) ?? [];
  return res.json({
    "groupSize": assignment.groupSize ?? 5,
    "surplusLargerGroups": assignment.surplusLargerGroups ?? false,
    "criteria": fullCriteria,
    "dealbreakers": fullDealbreakers,
  })
};

exports.setAllocationSetup = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const updatedGroupSize = req.body.groupSize;
  if (!updatedGroupSize || !Number.isInteger(updatedGroupSize))
    throw new InvalidParametersError("You must provide a valid target group size.");
  const updatedSurplusLarger = req.body.surplusLargerGroups;
  if (updatedSurplusLarger === undefined || typeof updatedSurplusLarger != "boolean")
    throw new InvalidParametersError("You must specify whether to make surplus groups larger or smaller.");
  const updatedCriteria = req.body.criteria;
  if (!updatedCriteria || !Array.isArray(updatedCriteria))
    throw new InvalidParametersError("You must provide a valid list of allocation criteria.");
  const updatedDealbreakers = req.body.dealbreakers;
  if (!updatedDealbreakers || !Array.isArray(updatedDealbreakers))
    throw new InvalidParametersError("You must provide a valid list of allocation dealbreakers.");
  // Check that criteria and dealbreakers are recognised
  if (!updatedCriteria.every(c => criteriaOptions.some(o => o.name == c.name)))
    throw new InvalidParametersError("One or more of the criteria are not recognised.");
  if (!updatedDealbreakers.every(c => dealbreakerOptions.some(o => o.name == c.name)))
    throw new InvalidParametersError("One or more of the deal-breakers are not recognised.");
  // Check that assignment is in a valid state
  const assignment = await assignmentModel.findById(req.params.assignment);
  if (assignment.state !== "allocation") {
    throw new AssignmentInvalidStateError("The assignment must be in the 'allocation' state to adjust the allocation setup.");
  }
  assignment.groupSize = updatedGroupSize;
  assignment.surplusLargerGroups = updatedSurplusLarger;
  assignment.allocationCriteria = updatedCriteria;
  assignment.allocationDealbreakers = updatedDealbreakers;
  await assignment.save();
  return res.json({ message: "Your allocation settings have been saved." });
};

exports.runAllocation = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  // Fetch the students list and allocation config from the assignment object.
  const assignment = await assignmentModel.findById(req.params.assignment).populate("students", "email displayName skills meetingPref noPair").lean();
  const studentsListStringIds = assignment.students.map(s => ({
    ...s,
    _id: s._id?.toString(),
  }));
  // Pre-process the criteria and dealbreakers. This involves extracting the
  // list of dataset attributes required (so that the uploaded CSV can be
  // checked), adding in extra data such as required skills and assigning
  // priority scores (highest = most important).
  const numCriteria = assignment.allocationCriteria.length;
  const requiredAttributes = new Set(["email"]);
  const criteria = assignment.allocationCriteria.map((c, i) => {
    if (c.name === "Skill coverage" && c?.skills == undefined) {
      c.skills = assignment.skills.map(s => s.name);
    }
    c.priority = numCriteria - i;
    if (c?.attribute) requiredAttributes.add(c.attribute);
    return c;
  });
  const dealbreakers = assignment.allocationDealbreakers.map(d => {
    d.penalty = 0;
    if (d.importance === 1) d.penalty = 0.1;
    if (d.importance === 2) d.penalty = 0.2;
    if (d.importance === 3) d.penalty = 0.5;
    if (d?.attribute) requiredAttributes.add(d.attribute);
    return d;
  });
  // If provided, parse the uploaded dataset file.
  let studentData;
  if (req.file) {
    try {
      // Attempt to load and parse the CSV.
      const parsePromise = new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(req.file.path);
        Papa.parse(fileStream, {
          header: true,
          complete: (results) => {
            resolve({ parsedData: results.data, datasetHeaders: results.meta.fields });
          },
          error: (err) => {
            console.warn(`Dataset upload error: ${err.message}`);
            reject(new InvalidFileError("The uploaded file was not valid. Please check the requested format and try again."));
          },
        });
      });
      // Check whether all of the required attributes are present.
      const { datasetHeaders, parsedData } = await parsePromise;
      const missingCols = Array.from(setDifference(requiredAttributes, new Set(datasetHeaders)));
      if (missingCols.length > 0)
        throw new InvalidFileError(`The dataset provided is missing one or more required columns: ${missingCols.join(", ")}.`);
      // Check that all students are accounted for in the dataset.
      if (parsedData.length < assignment.students.length)
        throw new InvalidFileError(`The dataset is missing data for some students. Please make sure you've included data for all ${assignment.students.length} students.`);
      const datasetMap = new Map(parsedData.map(s => [s?.email, s]));
      // Combine fields from the dataset with those from the database. Database
      // takes precedence to avoid accidentally overwiting displayNames etc.
      studentData = assignment.students.map(s => {
        const email = student.email;
        if (!datasetMap.has(email))
          throw new InvalidFileError(`The dataset is missing data for ${email}. Please check that you've included a row for each student.`);
        return {...datasetMap.get(email), ...s};
      });
    } finally {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error(`Failed to delete uploaded dataset: `, err.message);
      });
    }
  } else if (requiredAttributes.length > 1) {
    // Needs attributes but no dataset provided
    throw new InvalidFileError(`A dataset upload is required for the options selected. Please provide these columns: ${Array.from(requiredAttributes).join(", ")}.`);
  } else {
    // Dataset not provided and not required, so just use the data from the DB.
    studentData = assignment.students;
  }
  // Check if the "clash with other assignments" dealbreaker is present, and if
  // so, generate the teammate matrix for it.
  const assignmentClashDealbreaker = dealbreakers.filter(d => d.name === "Assignment crossover");
  let otherTeamMembers;
  if (assignmentClashDealbreaker.length > 0) {
    otherTeamMembers = await findTeamMates(studentsListStringIds.map(s => s._id));
  }
  let algo = new AllocationAlgorithm(studentsListStringIds, criteria, dealbreakers, assignment.groupSize, assignment.surplusLargerGroups, otherTeamMembers, "minimum");
  algo.createInitialPopulation();
  algo.run();
  // console.log(JSON.stringify(algo.population[0]));
  // console.log(algo.datasetStatistics);
  // algo.logBestGroup();
  const returnObj = algo.bestAllocationDetails();
  returnObj.criteria = criteria;
  return res.json(returnObj);
};

exports.confirmAllocation = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  // Get the assignment details and check that all students have been included
  const assignment = await assignmentModel.findById(req.params.assignment).populate("students", "email");
  const groups = req.body.allocation;
  if (!groups || !Array.isArray(groups))
    return res.status(400).json({ message: "You must provide a valid list of groups." });
  // Check that all students on the module are accounted for
  const studentsOnAssignment = assignment.students.map(s => s._id.toString());
  const studentsInRequest = groups.flat().map(id => id.toString());
  if (studentsOnAssignment.length != studentsInRequest.length || !studentsOnAssignment.every(id => studentsInRequest.includes(id)))
    return res.status(400).json({ message: "The list of students provided doesn't match the module enrollment list." });
  // Delete any existing teams for this assignment
  await teamModel.deleteMany({ assignment: req.params.assignment });
  // Create the teams
  await Promise.all(groups.map(async (members, index) => {
    return await teamModel.create({assignment: req.params.assignment, members, teamNumber: index+1});
  }));
  // Set assignment state to live
  assignment.state = "live";
  await assignment.save();
  // Send emails to students
  const studentEmails = assignment.students.map(s => s.email);
  teamsReleasedStudentEmail({ recipients: studentEmails, staffUserEmail: req.session.email, assignmentName: assignment.name, })
  return res.json({"message": "Allocation confirmed and released to students. Your assignment is live!"});
};
