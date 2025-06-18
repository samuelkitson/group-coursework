// test/api/user.test.js
const mongoose = require("mongoose");
const request = require("supertest");
const { setupTestEnvironment, teardownTestEnvironment, startSession, testUsers } = require("./setup.js");

// Import the userModel model
const userModel = require("../models/user.js");

let api, database;

beforeAll(async () => {
  const env = await setupTestEnvironment(5001);
  api = env.api;
  database = env.database;
}, 20000);

afterAll(async () => {
  await teardownTestEnvironment(api, database);
});

describe("/auth endpoints", () => {
  // Checks that the setup script has added both users correctly
  it("lecturer test user appears in database", async () => {
    const lecturerUser = await userModel.findById("67ffce5da9db1d313aa284a4").lean();
    expect(lecturerUser.role).toBe("lecturer");
  });

  it("student test user appears in database", async () => {
    const studentUser = await userModel.findById("67ffce492c633cccb82476fe").lean();
    expect(studentUser.role).toBe("student");
  });

  it("refresh does nothing when not logged in", async () => {
    const res = await request(api)
      .get("/api/auth/refresh");
    
    expect(res.statusCode).toBe(401);
  });

  it("startSession helper works as intended", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .get("/api/auth/refresh").set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.role).toBe("lecturer");
  });

  it("successfully logs in with correct credentials", async () => {
    const res = await request(api)
      .post("/api/auth/login")
      .send({
        email: "lecturer@example.com",
        password: "password"
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged in successfully");
    expect(res.body.data.email).toBe("lecturer@example.com");
    expect(res.body.data.role).toBe("lecturer");
    expect(res.body.data.displayName).toBe("Lecturer Lee");
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it("fails to log in with incorrect username", async () => {
    const res = await request(api)
      .post("/api/auth/login")
      .send({
        email: "whoami@example.com",
        password: "password"
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
  
  it("fails to log in with incorrect password", async () => {
    const res = await request(api)
      .post("/api/auth/login")
      .send({
        email: "lecturer@example.com",
        password: "wrongpassword"
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("logout ends session successfully", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    // Check that we're logged in
    let res = await request(api)
      .get("/api/auth/refresh").set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    // Now log out
    res = await request(api)
      .post("/api/auth/logout").set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    // Check that we're logged out
    res = await request(api)
      .get("/api/auth/refresh").set("Cookie", cookies);
    expect(res.statusCode).toBe(401);
  });
});
