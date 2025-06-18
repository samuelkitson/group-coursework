const { Types } = require("mongoose");

exports.testStudents = [
  {
    email: "e.parker@example.org",
    displayName: "Evelyn Parker",
    passwordHash: "$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm",
    role: "student",
    skills: {"Research": 5, "Sound design": 3, "Writing": 4},
    international: false,
    marks: { overall: 68 },
    meetingPref: "in-person",
    bio: "You can call me Eve! I'm part of the photography society",
  },{
    email: "a.collins@example.org",
    displayName: "Alex Collins",
    passwordHash: "$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm",
    role: "student",
    skills: {"Research": 2, "Sound design": 2, "Writing": 3},
    international: true,
    marks: { overall: 54 },
    meetingPref: "in-person",
    bio: "Hi I'm Alex, 3rd year Engineering 😄",
  },{
    email: "s.rossi@example.org",
    displayName: "Stefano Rossi",
    passwordHash: "$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm",
    role: "student",
    skills: {"Research": 6, "Sound design": 7, "Writing": 5},
    international: true,
    marks: { overall: 65 },
    meetingPref: "either",
    bio: "I speak Italian fluently and English is my second language, so please be patient with me",
  },{
    email: "e.carter@example.org",
    displayName: "Ellie Carter",
    passwordHash: "$2a$12$KYwAqXARCsO59hhsPn0kMuxtPsf9Osc3ToEXAH5BA5.eSrUcuDpOm",
    role: "student",
    skills: {"Research": 5, "Sound design": 1, "Writing": 3},
    international: false,
    marks: { overall: 56 },
    meetingPref: "either",
    bio: "I work full-time on Fridays so can't meet then",
  },
];

exports.testStudentIds = [
  new Types.ObjectId("67cb43c4aae9497689bee681"),
  new Types.ObjectId("67cb43502109ac2509ed3fe9"),
  new Types.ObjectId("67cb43c4aae9497689bee682"),
  new Types.ObjectId("67cb43502109ac2509ed3fe8"),
];

exports.testAssignment1 = {
  name: "Games Design",
  description: "Work together to design and build your very own platformer game!",
  state: "allocation-questions",
  lecturers: ["6796bd91ae30ef147fe9496c"],
  skills: [
    {
      name: "Research",
      description: "Research skills such as finding journal papers and using the library"
    },
    { name: "Sound design",
      description: "Sound effects, background music, etc..."
    },
    {
      name: "Writing",
      description: "General confidence at writing academic reports"
    },
  ],
};

exports.testAssignment2 = {
  name: "Robotics Project",
  description: "In teams of 5, you'll work to design, build and test a robotics system for a real-life customer. This assignment involves writing a report at the end and giving a presentation.",
  state: "live",
  lecturers: ["6796bd91ae30ef147fe9496c"],
  skills: [
    {
      name: "Research",
      description: "Research skills such as finding journal papers and using the library"
    },{ name: "Electronics",
      description: "Designing and constructing electronics"
    },{ name: "Public speaking",
      description: "Presenting to a group"
    },{
      name: "Writing",
      description: "General confidence at writing academic reports"
    },
  ],
};

exports.testMeetings = (teamId, studentIds) => {
  return [{
    team: teamId,
    location: "Building 1, Room 1001",
    dateTime: "2025-03-03 13:00:00",
    minuteTaker: studentIds[2],
    attendance: {
      attended: studentIds.slice(2, 5),
      apologies: [studentIds[1]],
      absent: [studentIds[0]],
    },
    discussion: "- Met for the first time\n- Did some icebreakers\n- Planned out the project work week-by-week\n- Created a WhatsApp group chat\n- Planned meeting for Friday",
    newActions: [{
      action: "Book meeting room",
      assignees: studentIds.slice(1, 2),
    },{
      action: "Contact our supervisor",
      assignees: studentIds.slice(4, 5),
    }],
  },{
    team: teamId,
    location: "Building 1, Room 1001",
    dateTime: "2025-03-07 11:30:00",
    minuteTaker: studentIds[3],
    attendance: {
      attended: studentIds.slice(1, 5),
      apologies: [],
      absent: [studentIds[0]],
    },
    discussion: "- Alex emailed the supervisor but no reply yet\n- Evelyn hasn't responded to any messages yet\n- Planned out the initial research\n- Agreed to use OneDrive as a team\n- Decided on a weekly Monday meeting",
    previousActions: [{
      action: "Book meeting room",
      assignees: studentIds.slice(1, 2),
      complete: true,
    },{
      action: "Contact our supervisor",
      assignees: studentIds.slice(4, 5),
      complete: false,
    }],
    newActions: [{
      action: "Set up OneDrive area",
      assignees: studentIds.slice(4, 5),
    },{
      action: "Research existing systems",
      assignees: studentIds.slice(3, 5),
    },{
      action: "Source possible equipment",
      assignees: studentIds.slice(2, 4),
    },{
      action: "Contact our supervisor",
      assignees: studentIds.slice(1, 2),
      complete: true,
    }],
  }];
};

exports.testMeetingMinutes = [
`- Met for the first time
- Planned to meet our supervisor
- Did some icebreakers
- Planned a regular meeting slot
- Set up our IDEs`,
`- Met with our supervisor
- Planned out the next week of work
- Started the research stage and assigned topics`,
`- Shared our individual research so far
- Set up a OneDrive area for us to put research notes in
- Created the basic presentation template`
];

exports.testMeetingActions = [
  "Contact supervisor",
  "Do some initial research",
  "Buy some sticky notes",
  "Set up Git repo",
  "Set up Figma",
  "Start the UI design",
  "Carry out initial interviews",
  "Plan the advertising video",
];
