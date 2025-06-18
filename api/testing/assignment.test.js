// test/api/user.test.js
const request = require("supertest");
const { setupTestEnvironment, teardownTestEnvironment, startSession, testUsers } = require("./setup.js");

let api, database;

// Import the models
const userModel = require("../models/user.js");
const assignmentModel = require("../models/assignment.js");

beforeAll(async () => {
  const env = await setupTestEnvironment(5000);
  api = env.api;
  database = env.database;
}, 20000);

afterAll(async () => {
  await teardownTestEnvironment(api, database);
});

describe("/assignment endpoints", () => {
  let assignmentId;

  it("assignment can be created", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .post("/api/assignment").set("Cookie", cookies).send({
        name: "Test Assignment",
        description: "This is a test assignment",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.assignmentId).toBeDefined();
    assignmentId = res.body.assignmentId;
    // Check that it has been created correctly
    const assignmentObject = await assignmentModel.findById(assignmentId).lean();
    expect(assignmentObject.name).toBe("Test Assignment");
    expect(assignmentObject.description).toBe("This is a test assignment");
  });

  it("assignment can be edited", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .patch(`/api/assignment/${assignmentId}`).set("Cookie", cookies).send({
        name: "Group Project",
        description: "This is a new test assignment",
      });
    expect(res.statusCode).toBe(200);
    // Check that it has updated correctly
    const assignmentObject = await assignmentModel.findById(assignmentId).lean();
    expect(assignmentObject.name).toBe("Group Project");
    expect(assignmentObject.description).toBe("This is a new test assignment");
  });

  it("assignment appears in list for user", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .get(`/api/assignment/all`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe("Group Project");
  });

  it("assignment can be deleted", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .delete(`/api/assignment/${assignmentId}`).set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
  });

  it("assignment can't be deleted twice", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .delete(`/api/assignment/${assignmentId}`).set("Cookie", cookies);

    expect(res.statusCode).toBe(404);
  });
});
