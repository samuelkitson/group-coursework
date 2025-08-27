// test/api/questionnaire.test.js
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
    state: "pre-allocation",
    skills: [{name: "Writing"}, {name: "Sound Design", description: "Including Audacity"}],
  });
}, 20000);

afterAll(async () => {
  await teardownTestEnvironment(api, database);
});

describe("/questionnaire endpoints", () => {
  it("existing skills can be fetched", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .get("/api/questionnaire/existing-skills").set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.skills).toMatchObject([{name: "Writing"}, {name: "Sound Design", description: "Including Audacity"}]);
  });

  it("skills questionnaire can be fetched", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    const res = await request(api)
      .get(`/api/questionnaire/skills?assignment=${assignment.id}`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject([{name: "Writing"}, {name: "Sound Design", description: "Including Audacity"}]);
  });

  it("skill ratings can be updated", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    const res = await request(api)
      .patch("/api/questionnaire/skills").set("Cookie", cookies).send(
        {skills: {"Writing": 5, "Sound Design": 3}}
      );
    expect(res.statusCode).toBe(200);
    // Check that it has updated correctly
    const userObject = await userModel.findById(testUsers.student._id).lean();
    expect(userObject.skills).toMatchObject({"Writing": 5, "Sound Design": 3});
  });

  it("skills questionnaire now also contains ratings", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    const res = await request(api)
      .get(`/api/questionnaire/skills?assignment=${assignment.id}`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject([{name: "Writing", rating: 5}, {name: "Sound Design", description: "Including Audacity", rating: 3}]);
  });
});
