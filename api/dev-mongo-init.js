db.users.drop();
db.assignments.drop();

// Insert test users
db.users.insertMany([
  {
    _id: ObjectId("6796bd91ae30ef147fe9496b"),
    email: "test@samkitson.com",
    displayName: "Test User",
    passwordHash:
      "$2a$12$RzGL1/0kKn4pA3rGhjXGcOI19PFBEN3cIrDOsxNARYhe9wItDItF2",
    role: "student",
    skills: {
      "Java": 6,
      "Python": 3,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
  {
    _id: ObjectId("6796bd91ae30ef147fe9496c"),
    email: "bob-staff@samkitson.com",
    displayName: "Bob Bobbington",
    passwordHash:
      "$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
  {
    _id: ObjectId("6796bd91ae30ef147fe9496d"),
    email: "charlie-staff@samkitson.com",
    displayName: "Charlie Smith",
    passwordHash:
      "$2a$12$BwkEfF/GOl4m2Uy.WVIS1ORubjGCdmYMl0u7TITScRrFoowN6ILhO",
    role: "staff",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
  {
    _id: ObjectId("6796bd91ae30ef147fe9496e"),
    email: "dave-student@samkitson.com",
    displayName: "Dave Green",
    passwordHash:
      "$2a$12$hW67Q0pSZlYcM33z.fWQ3uhrKj52Zcp5oC7MQ9bD9hF5mguQH1iLq",
    role: "student",
    skills: {
      "Java": 6,
      "UI Design": 2,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
]);

// Insert test assignments
db.assignments.insertMany([
  {
    _id: ObjectId("6797e401ded726b06ee9496a"),
    name: "Interaction Design",
    description: "COMP2213 24/25",
    owner: "test@samkitson.com",
    start_date: new Date("2025-02-01"),
    end_date: new Date("2025-05-31"),
    required_attributes: ["average_mark", "skills"],
    state: "allocation-questions",
    groups: [],
    students: [],
    staffs: [ObjectId("6796bd91ae30ef147fe9496c")],
    groupSize: 5,
    skills: [
      { name: "Java programming" },
      {
        name: "UI design",
        description: "UI design skills, including tools like Figma.",
      },
      {
        name: "Research",
        description:
          "Research skills such as finding journal papers and using the library.",
      },
    ],
    allocationCriteria: [
      {
        tag: "skill-coverage",
        value: true,
      },
    ],
  },
  {
    _id: ObjectId("6797e401ded726b06ee9496b"),
    name: "SEG",
    description: "COMP2211 24/25",
    owner: "test@samkitson.com",
    start_date: new Date("2025-02-01"),
    end_date: new Date("2025-05-31"),
    required_attributes: ["average_mark", "skills"],
    state: "live",
    groups: [],
    students: [ObjectId("6796bd91ae30ef147fe9496b")],
    staffs: [
      ObjectId("6796bd91ae30ef147fe9496c"),
      ObjectId("6796bd91ae30ef147fe9496d"),
    ],
  },
]);

print("MongoDB initialised with test data.");
