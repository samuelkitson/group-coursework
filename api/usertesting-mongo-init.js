db.users.drop();
db.assignments.drop();
db.meetings.drop();
db.checkins.drop();
db.teams.drop();

// Insert test users
db.users.insertMany([
  {
    _id: ObjectId("6796bd91ae30ef147fe9496c"),
    email: "b.smith@example.org",
    displayName: "Dr. Bob Smith",
    passwordHash:
      "$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm",
    role: "lecturer",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
  {
    _id: ObjectId('67cb43c4aae9497689bee681'),
    email: 'e.parker@example.org',
    displayName: 'Evelyn Parker',
    passwordHash: '$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm',
    bio: "You can call me Eve! I'm part of the photography society",
    role: 'student',
    skills: { Research: 5, 'Sound design': 3, 'Writing': 4, 'Electronics': 3, 'Public speaking': 7, },
    meetingPref: 'in-person',
    international: false,
    marks: { overall: 68 },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },{
    _id: ObjectId('67cb43502109ac2509ed3fe9'),
    email: 'e.carter@example.org',
    displayName: 'Ellie Carter',
    passwordHash: '$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm',
    bio: "I work full-time on Fridays so can't meet then",
    role: 'student',
    skills: { Research: 5, 'Sound design': 1, 'Writing': 3, 'Electronics': 1, 'Public speaking': 3, },
    meetingPref: 'either',
    international: false,
    marks: { overall: 56 },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },{
    _id: ObjectId('67cb43c4aae9497689bee682'),
    email: 'a.collins@example.org',
    displayName: 'Alex Collins',
    passwordHash: '$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm',
    bio: "Hi I'm Alex, 3rd year Engineering 😄",
    role: 'student',
    skills: { Research: 2, 'Sound design': 2, 'Writing': 3, 'Electronics': 2, 'Public speaking': 2, },
    meetingPref: 'in-person',
    international: true,
    marks: { overall: 54 },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },{
    _id: ObjectId('67cb43502109ac2509ed3fe8'),
    email: 's.rossi@example.org',
    displayName: 'Stefano Rossi',
    passwordHash: '$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm',
    bio: "I speak Italian fluently and English is my second language, so please be patient with me",
    role: 'student',
    skills: { Research: 6, 'Sound design': 7, 'Writing': 5, 'Electronics': 4,  },
    meetingPref: 'either',
    international: true,
    marks: { overall: 65 },
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  },
]);

print("MongoDB initialised user test data.");
