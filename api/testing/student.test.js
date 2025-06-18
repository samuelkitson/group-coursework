const request = require("supertest");
const { setupTestEnvironment, teardownTestEnvironment, startSession, testUsers } = require("./setup.js");

let api, database;

// Import the models
const userModel = require("../models/user.js");
const assignmentModel = require("../models/assignment.js");
const assignment = require("../models/assignment.js");

let assignmentId;
let otherStudents = [];

beforeAll(async () => {
  const env = await setupTestEnvironment(5000);
  api = env.api;
  database = env.database;

  // Create some fake other students
  const student1 = await userModel.create({
    displayName: "Student A",
    email: "a@example.com",
    role: "student",
    passwordHash: "$2a$04$fvAd3vGMelajpA.3wZjxm.2679jurVSh8uVFyzcjY7.DUgzqtiIJi",
  });
  otherStudents.push(student1._id);
  const student2 = await userModel.create({
    displayName: "Student B",
    email: "b@example.com",
    role: "student",
    passwordHash: "$2a$04$fvAd3vGMelajpA.3wZjxm.2679jurVSh8uVFyzcjY7.DUgzqtiIJi",
  });
  otherStudents.push(student2._id);

  // Create a test assignment to add students to
  const assignment = await assignmentModel.create({
    name: "Test assignment",
    description: "Test description",
    lecturers: [testUsers.lecturer._id, ...otherStudents],
  });
  assignmentId = assignment._id.toString();
}, 20000);

afterAll(async () => {
  await teardownTestEnvironment(api, database);
});

describe("/student endpoints", () => {
  it("profile can be edited and fetched", async () => {
    const { cookies } = await startSession(api, testUsers.student);
    let res = await request(api)
      .patch(`/api/student/profile`).set("Cookie", cookies).send({
        meetingPref: "online",
        bio: "New user bio",
      });
    expect(res.statusCode).toBe(200);
    // Fetch and check that it has been updated
    res = await request(api)
      .get(`/api/student/profile`).set("Cookie", cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.profile.bio).toBe("New user bio");
    expect(res.body.profile.meetingPref).toBe("online");
  });

  it("lecturers cannot edit their profile", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    let res = await request(api)
      .patch(`/api/student/profile`).set("Cookie", cookies).send({
        meetingPref: "online",
        bio: "New user bio",
      });
    expect(res.statusCode).toBe(403);
  });

  it("pairing exclusion can be set", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .put(`/api/student/exclusions`).set("Cookie", cookies).send({
        student: testUsers.student._id,
        others: [otherStudents[0]],
      }).expect(200);
    // Check pairing exclusions set correctly
    const student1 = await userModel.findById(testUsers.student._id);
    expect(student1.noPair.some(id => id.equals(otherStudents[0]))).toBe(true);
    expect(student1.noPair.some(id => id.equals(otherStudents[1]))).toBe(false);
    const student2 = await userModel.findById(otherStudents[0]);
    expect(student2.noPair.some(id => id.equals(testUsers.student._id))).toBe(true);
    expect(student2.noPair.some(id => id.equals(otherStudents[1]))).toBe(false);
  });

  it("pairing exclusion can't include themselves", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    const res = await request(api)
      .put(`/api/student/exclusions`).set("Cookie", cookies).send({
        student: testUsers.student._id,
        others: [testUsers.student._id],
      }).expect(400);
  });

  it("can't remove student from non-existent assignment", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    await request(api)
      .patch(`/api/student/unenrol`).set("Cookie", cookies).send({
        student: testUsers.student._id,
        assignment: "6800145326ca62c772d14a38",
      }).expect(404);
  });

  it("students can be removed from assignments", async () => {
    const { cookies } = await startSession(api, testUsers.lecturer);
    await request(api)
      .patch(`/api/student/unenrol`).set("Cookie", cookies).send({
        student: testUsers.student._id,
        assignment: assignmentId,
      }).expect(200);
  });

  // it("student CSVs are handled correctly", async () => {
  //   // Create a stream for the CSV file
  //   const studentCsv = "email,displayName,international,marks.overall\ns1@example.com,Student One,true,50\ns2@example.com,Student Two,false,60\ns3@example.com,Student Three,true,70";
  //   const studentCsvBuffer = Buffer.from(studentCsv, "utf8");

  //   const { cookies } = await startSession(api, testUsers.lecturer);
  //   let res = await request(api)
  //     .post("/api/student/upload")
  //     .set("Cookie", cookies)
  //     .set("Content-Type", "multipart/form-data")
  //     .field("assignment", assignmentId)
  //     .attach("csv", studentCsvBuffer, "students.csv");

  //   expect(res.statusCode).toBe(200);
  // });
});
