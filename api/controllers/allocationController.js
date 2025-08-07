const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const { AllocationAlgorithm } = require("../algorithm/algorithm");
const { criteriaOptions, criteriaOptionsMap, dealbreakerOptions, dealbreakerOptionsMap } = require("../models/allocationOptions");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const { Types } = require("mongoose");
const { checkAssignmentRole } = require("../utility/auth");
const { AssignmentInvalidStateError, InvalidParametersError, InvalidFileError, CustomError, TimeoutError, AllocationError } = require("../errors/errors");
const { teamsReleasedStudentEmail } = require("../utility/emails");
const { setDifference } = require("../utility/maths");

/**
 * Given an object (such as a student record), attempt to cast one of its values
 * to a boolean from a string. Converts strings such as TRUE, true, True, etc.
 * 
 * @param object The object with the value to cast.
 * @param {String} key The key of the value to cast.
 * @param {Boolean} castError If true, throw an error if a non-null, invalid value is found. If false, just default to null.
 * @param {Boolean} nullError If true, throw an error if the vlaue is missing. If false, just default to null.
 * @returns The object with the value re-cast.
 */
const castObjKeyToBool = (object, key, castError=true, nullError=false) => {
  if (!object?.[key]) {
    if (nullError) throw new InvalidFileError(`A missing value was found for the ${key} attribute. Please provide a value for every student.`);
    object[key] = null;
    return object;
  }
  switch (object?.[key]?.toLowerCase()) {
    case null:
      object[key] = null;
      break;
    case "true":
      object[key] = true;
      break;
    case "false":
      object[key] = false;
      break;
    default:
      if (castError) throw new InvalidFileError(`An invalid value was found for the ${key} attribute. "${object?.[key]}" is not true or false.`);
      object[key] = null;
      break;
  }
  return object;
};

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

/**
 * Runs the allocation algorithm in a separate worker thread to prevent the main
 * thread from being blocked.
 * 
 * @param workerData object of data to be passed to AllocationAlgorithm
 * @returns Promise that resolves when the allocation algorithm finishes
 * @throws {CustomError} throws error if the allocation algorithm fails, times out after 30s or if the worker crashes
 */
const runAlgorithmWoker = (workerData) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "..", "algorithm", "worker.js"), { workerData });
    // Timeout after 30 seconds.
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new TimeoutError("The allocation algorithm took too long to run. Please simplify your requirements and try again."));
    }, 30000);
    // Listen for messages from the worker (indicates fail or complete).
    worker.on("message", (data) => {
      clearTimeout(timeout);
      if (data.success) {
        resolve(data.result);
      } else {
        reject(new AllocationError(data?.error?.stack));
      }
    })
    // Listen for unhandled errors.
    worker.on("error", (error) => {
      clearTimeout(timeout);
      reject(new AllocationError(error?.stack));
    });
    // Listen for worker exit.
    worker.on("exit", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new AllocationError(`Algorithm worker exited with status code ${code}.`));
      }
    });
  });
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
          transform: (value) => (value === "" ? null : value),
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
        const email = s.email;
        if (!datasetMap.has(email))
          throw new InvalidFileError(`The dataset is missing data for ${email}. Please check that you've included a row for each student.`);
        const mergedRecord = {...datasetMap.get(email), ...s, _id: s._id.toString(), };
        // Cast boolean types as appropriate
        if (requiredAttributes.has("international"))
          castObjKeyToBool(mergedRecord, "international");
        if (requiredAttributes.has("enrolled"))
          castObjKeyToBool(mergedRecord, "enrolled");
        return mergedRecord;
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
    studentData = assignment.students.map(s => ({ ...s, _id: s._id.toString(), }));
  }
  // Check if the "clash with other assignments" dealbreaker is present, and if
  // so, generate the teammate matrix for it.
  const assignmentClashDealbreaker = dealbreakers.filter(d => d.name === "Assignment crossover");
  let otherTeamMembers;
  if (assignmentClashDealbreaker.length > 0) {
    otherTeamMembers = await findTeamMates(studentData.map(s => s._id));
  }
  // Run the algorithm.
  const startTime = Date.now();
  console.log(studentData[0]);
  const workerData = { studentData, criteria, dealbreakers, groupSize: assignment.groupSize, surplusLargerGroups: assignment.surplusLargerGroups, otherTeamMembers, };
  const algorithmResult = await runAlgorithmWoker(workerData);
  const executionTime = Date.now() - startTime;
  // Return the results to the client.
  return res.json({...algorithmResult, criteria, dealbreakers, executionTime, });
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
