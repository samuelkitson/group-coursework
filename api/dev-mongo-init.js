db.users.drop();
db.assignments.drop();

// Insert test users
db.users.insertMany([
  {
    _id: ObjectId("68b07832cd5f1a40ad35e41d"),
    email: "admin-test@example.org",
    displayName: "Alice Tester",
    passwordHash:
      "$2a$12$KztuM2tCf.higijkCo/VxuYALtnmXnZ5K22/z8QhdCpj.lR2R6klS",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
  {
    _id: ObjectId("68b0783c7bfea59a92fbdbb3"),
    email: "staff-test@example.org",
    displayName: "Bob Tester",
    passwordHash:
      "$2a$12$4rzxlrOGQ9ISsNOX9S6/uO2RMQ3zs.kB2zGSfvhF6t2CF9Jnadwsa",
    role: "staff",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
  {
    _id: ObjectId("68b0786744b856dc8c1ab270"),
    email: "student-test@example.org",
    displayName: "Charlie Tester",
    passwordHash:
      "$2a$12$bl6nFzBbKKZPCxIH47Yup.uRiqIRlYsSk5eSgFK.AKJcG6M57KEMa",
    role: "student",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
]);

// Insert test assignment
db.assignments.insertMany([
  {
    _id: ObjectId("6797e401ded726b06ee9496a"),
    name: "Example Module",
    description: "This is an example module to help you explore the app.",
    lecturers: [
      ObjectId("68b07832cd5f1a40ad35e41d"),
      ObjectId("68b0783c7bfea59a92fbdbb3"),
    ],
    students: [
      ObjectId("68b0786744b856dc8c1ab270"),
    ],
    state: "pre-allocation",
  },
]);

print("MongoDB initialised with test data.");
