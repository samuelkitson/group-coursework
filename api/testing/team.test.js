// test/api/team.test.js
const request = require("supertest");
const { setupTestEnvironment, teardownTestEnvironment, startSession, testUsers, otherStudentIds } = require("./setup.js");

let api, database;

// Import the models
const teamModel = require("../models/team.js");
const userModel = require("../models/user.js");
const assignmentModel = require("../models/assignment.js");

let assignment, team;

beforeAll(async () => {
  const env = await setupTestEnvironment(5000);
  api = env.api;
  database = env.database;

  // Create a test assignment
  assignment = await assignmentModel.create({
    name: "Test Assignment",
    description: "Test",
    lecturers: [testUsers.lecturer._id],
    students: [testUsers.student._id, ...otherStudentIds],
    state: "live",
    groupSize: 5,
    skills: [{name: "Writing"}, {name: "Sound Design", description: "Including Audacity"}],
  });

  // Create a test team
  team = await teamModel.create({
    assignment: assignment._id,
    teamNumber: 1,
    members: [testUsers.student._id, ...otherStudentIds],
  });
}, 20000);

afterAll(async () => {
  await teardownTestEnvironment(api, database);
});

describe("/team endpoints", () => {
  it("student's team can be fetched", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    const res = await request(api)
      .get(`/api/team/mine?assignment=${assignment._id}`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.teams[0]._id).toEqual(team._id.toString());
  });
});
