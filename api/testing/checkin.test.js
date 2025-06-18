// test/api/checkin.test.js
const request = require("supertest");
const { setupTestEnvironment, teardownTestEnvironment, startSession, testUsers, otherStudentIds } = require("./setup.js");

let api, database;

// Import the models
const teamModel = require("../models/team.js");
const userModel = require("../models/user.js");
const checkinModel = require("../models/checkin.js");
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

describe("/checkin endpoints", () => {
  it("available checkin can be fetched", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    const res = await request(api)
      .get(`/api/checkin?team=${team._id}`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.open).toBe(true);
    expect(res.body.completionRate.done).toBe(0);
    expect(res.body.completionRate.outOf).toBe(5);
  });

  it("incomplete checkin rejected", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    let body = {
      team: team._id.toString(),
      effortPoints: otherStudentIds.reduce((obj, str) => {
        obj[str] = 4;
        return obj;
      }, {}),
    };
    delete body.effortPoints[testUsers.student._id];
    const res = await request(api)
      .post("/api/checkin").set("Cookie", cookies).send(body);
    expect(res.statusCode).toBe(400);
  });

  it("valid checkin accepted", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    let body = {
      team: team._id.toString(),
      effortPoints: otherStudentIds.reduce((obj, str) => {
        obj[str] = 4;
        return obj;
      }, {}),
    };
    body.effortPoints[testUsers.student._id] = 4;
    const res = await request(api)
      .post("/api/checkin").set("Cookie", cookies).send(body);
    expect(res.statusCode).toBe(200);
  });

  it("completion rate updated successfully", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    const res = await request(api)
      .get(`/api/checkin?team=${team._id}`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.open).toBe(false);
    expect(res.body.completionRate.done).toBe(1);
    expect(res.body.completionRate.outOf).toBe(5);
  });
});
