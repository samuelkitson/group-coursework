// test/api/allocation.test.js
const request = require("supertest");
const { setupTestEnvironment, teardownTestEnvironment, startSession, testUsers } = require("./setup.js");

let api, database;

// Import the models
const userModel = require("../models/user.js");
const assignmentModel = require("../models/assignment.js");

let assignment;

beforeAll(async () => {
  const env = await setupTestEnvironment(5000);
  api = env.api;
  database = env.database;

  // Create a test assignment
  assignment = await assignmentModel.create({
    name: "Test Assignment",
    description: "Test",
    lecturers: [testUsers.lecturer._id],
    students: [testUsers.student._id],
    state: "allocation",
    skills: [{name: "Writing"}, {name: "Sound Design", description: "Including Audacity"}],
  });
}, 20000);

afterAll(async () => {
  await teardownTestEnvironment(api, database);
});

describe("/allocation endpoints", () => {
  it("criteria and dealbreaker options fetchable", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .get(`/api/allocation/${assignment.id}/options`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.skills).toMatchObject([{name: "Writing"}, {name: "Sound Design", description: "Including Audacity"}]);
    expect(res.body).toHaveProperty("criteria");
    expect(res.body).toHaveProperty("dealbreakers");
  });

  it("current allocation setup fetchable", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .get(`/api/allocation/${assignment.id}/setup`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.surplusLargerGroups).toBe(false);
    expect(res.body.groupSize).toBe(5);
    expect(res.body).toHaveProperty("criteria");
    expect(res.body).toHaveProperty("dealbreakers");
  });
});
