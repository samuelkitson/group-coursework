const { AllocationAlgorithm } = require("../algorithm/algorithm");
const { criteriaOptions, criteriaOptionsMap, dealbreakerOptions, dealbreakerOptionsMap } = require("../models/allocationOptions");
const assignmentModel = require("../models/assignment");
const teamModel = require("../models/team");
const { Types } = require("mongoose");
const { checkAssignmentRole } = require("../utility/auth");
const { AssignmentInvalidStateError } = require("../errors/errors");

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
  temporaryCriteriaOptions = criteriaOptions;
  return res.json({
    "criteria": temporaryCriteriaOptions,
    "dealbreakers": dealbreakerOptions,
    "skills": assignment?.skills,
  })
};

exports.getAllocationSetup = async (req, res) => {
  await checkAssignmentRole(req.params.assignment, req.session.userId, "lecturer");
  const assignment = await assignmentModel.findById(req.params.assignment).select("allocationCriteria allocationDealbreakers groupSize surplusLargerGroups").lean();
  fullCriteria = assignment.allocationCriteria?.map(criterion => {
    const fullCriterion = criteriaOptionsMap.get(criterion.tag);
    if (fullCriterion) {
      return { ...fullCriterion, ...criterion };
    }
    return criterion;
  }) ?? [];
  fullDealbreakers = assignment.allocationDealbreakers?.map(dealbreaker => {
    const fullDealbreaker = dealbreakerOptionsMap.get(dealbreaker.tag);
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
  const studentsList = await assignmentModel.findById(req.params.assignment).select("students").populate("students", "-passwordHash").lean();
  const studentsListStringIds = studentsList.students.map(s => ({
    ...s,
    _id: s._id?.toString(),
  }));
  const assignment = await assignmentModel.findById(req.params.assignment).lean();
  // Assign priorities in order
  const numCriteria = assignment.allocationCriteria.length;
  const criteria = assignment.allocationCriteria.map((c, i) => {
    if (c["tag"] === "skill-coverage" && c["skills"] == undefined) {
      c["skills"] = assignment.skills.map(s => s.name);
    }
    c["priority"] = numCriteria - i;
    return c;
  });
  const dealbreakers = assignment.allocationDealbreakers.map(c => {
    c["penalty"] = 0;
    if (c["importance"] === 1) c["penalty"] = 0.1;
    if (c["importance"] === 2) c["penalty"] = 0.2;
    if (c["importance"] === 3) c["penalty"] = 0.5;
    return c;
  });
  // Check if the "clash with other assignments" dealbreaker is present, and if
  // so, generate the teammate matrix for it.
  const assignmentClashDealbreaker = dealbreakers.filter(d => d.tag === "inter-module-clash");
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
  const assignment = await assignmentModel.findById(req.params.assignment);
  const groups = req.body.allocation;
  if (!groups || !Array.isArray(groups))
    return res.status(400).json({ message: "You must provide a valid list of groups." });
  // Check that all students on the module are accounted for
  const studentsOnAssignment = assignment.students.map(id => id.toString());
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
  return res.json({"message": "Allocation confirmed and released to students. Your assignment is live!"});
};
