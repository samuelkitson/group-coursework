// This file sets up the relevant testing environments for the unit tests
// Run tests using: npm test -- --forceExit --runInBand --verbose

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

// Import the userModel model
const userModel = require("../models/user.js");

// database stores the in-memory MongoDB handle
let database;
// api can be used to call API endpoints directly
let api;

// Clear the database and remove all data, without destroying the DB instance
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

const testUsers = {
  "student":
    {
      _id: "67ffce492c633cccb82476fe",
      email: "student@example.com",
      password: "password",
      passwordHash: "$2a$04$HJFexoK7jLSmbkbyKBbB0uCSpT21xCU/LcuU2.kb0jRWg5/Mt2cf2", // password
      displayName: "Student Smith",
      role: "student"
    },
  "lecturer":
    {
      _id: "67ffce5da9db1d313aa284a4",
      email: "lecturer@example.com",
      password: "password",
      passwordHash: "$2a$04$HJFexoK7jLSmbkbyKBbB0uCSpT21xCU/LcuU2.kb0jRWg5/Mt2cf2", // password
      displayName: "Lecturer Lee",
      role: "lecturer"
    }
};

const otherStudents = [
  {
    _id: "680f5e78f7692f105c3b86c2",
    email: "student1@example.com",
    password: "password",
    passwordHash: "$2a$04$HJFexoK7jLSmbkbyKBbB0uCSpT21xCU/LcuU2.kb0jRWg5/Mt2cf2", // password
    displayName: "Student A",
    role: "student"
  },{
    _id: "680f5e8ebc7b8888f4568cba",
    email: "student2@example.com",
    password: "password",
    passwordHash: "$2a$04$HJFexoK7jLSmbkbyKBbB0uCSpT21xCU/LcuU2.kb0jRWg5/Mt2cf2", // password
    displayName: "Student B",
    role: "student"
  },{
    _id: "680f5e91651fd9804441422a",
    email: "student3@example.com",
    password: "password",
    passwordHash: "$2a$04$HJFexoK7jLSmbkbyKBbB0uCSpT21xCU/LcuU2.kb0jRWg5/Mt2cf2", // password
    displayName: "Student C",
    role: "student"
  },{
    _id: "680f5e9514e2892bf19db68a",
    email: "student4@example.com",
    password: "password",
    passwordHash: "$2a$04$HJFexoK7jLSmbkbyKBbB0uCSpT21xCU/LcuU2.kb0jRWg5/Mt2cf2", // password
    displayName: "Student D",
    role: "student"
  },
];
const otherStudentIds = otherStudents.map(s => s._id);

// Create the test users
async function createTestUsers() {
  await userModel.insertMany([testUsers.lecturer, testUsers.student]);
  await userModel.insertMany(otherStudents);
}

// Helper function used to log in as a user
// Provide the credentials to log in as either a lecturer or student
async function startSession(api, user) {
  const res = await request(api).post("/api/auth/login").send({ email: user.email, password: user.password });
  // Catch any login errors
  if (res.statusCode !== 200) {
    throw new Error(`Authentication failed: ${res.body.message}`);
  }
  // Intercept the cookie from the headers
  return {
    cookies: res.headers["set-cookie"],
    userData: res.body.data,
  };
}

// Set up the testing environment
async function setupTestEnvironment(port) {
  // Connect to the in-memory database
  database = await MongoMemoryServer.create();
  process.env.MONGO_URI = database.getUri();
  process.env.SESSION_SECRET = "unit-testing-secret";
  
  // Start up the server
  let app = require("../app");
  api = app.listen(port);
  
  // Wait until the database connection has been established
  await mongoose.connection.asPromise();

  await createTestUsers();
  
  return { api, database };
}

// Tear down the testing environment
async function teardownTestEnvironment(api, database) {
  // If the API is alive, kill it
  if (api && api.close) {
    await new Promise((resolve) => api.close(resolve));
  }

  // If the database is alive, kill it
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (database) {
    await database.stop();
  }
}

module.exports = {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
  startSession,
  testUsers,
  otherStudents,
  otherStudentIds,
};
