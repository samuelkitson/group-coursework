/**
 * The options attribute determines which (if any) form controls appear for the
 * user on the allocation control page for the criterion. They are:
 *   - field: a text box that allows the user to specify a spreadsheet column
 *   - goal: a dropdown/selector to choose between similar or diverse together
 *   - missing: a checkbox that if selected ignores missing values, and if
 *       not selected treats empty values as a value in itself
 */

const criteriaOptions = [
  {
    name: "Skill coverage",
    description: "Teams have someone confident in each required skill.",
    category: "skills",
  },{
    name: "Past performance",
    description: "Allocate based on students' past performance and marks.",
    category: "data",
    options: ["goal"],
  },{
    name: "Degree programme",
    description: "Allocate using students' degree programmes.",
    category: "data",
    options: ["goal"],
  },{
    name: "Enrolment",
    description: "Group together or split up students who are unenrolled.",
    category: "data",
    options: ["goal"],
  },{
    name: "Meeting preference",
    description: "Allocate using students' expressed meeting preferences.",
    category: "personal",
  },{
    name: "International",
    description: "Group international students together or split them up.",
    category: "language",
    options: ["goal"],
  },{
    name: "Custom (textual)",
    description: "A custom criterion for a textual spreadsheet column.",
    category: "custom",
    options: ["field", "goal", "missing"],
  },{
    name: "Custom (numeric)",
    description: "A custom criterion for a numeric spreadsheet column.",
    category: "custom",
    options: ["field", "goal", "missing"],
  },
];



const criteriaOptionsOld = [
  {
    type: "preset",
    tag: "skill-coverage",
    title: "Skill coverage",
    description:
      "Teams have someone confident in each required skill.",
    category: "skills",
    value: true, // true if the option to prevent one student being best at everything is disabled
  },
  {
    type: "customisable",
    tag: "specific-skill",
    title: "Prioritise specific skill",
    description: "Teams have someone confident in a specific critical skill.",
    category: "skills",
  },
  {
    type: "goals",
    tag: "past-performance",
    title: "Past performance",
    description:
      "Allocate teams based on students' past performance and marks.",
    category: "data",
    goal: "similar",
  },
  {
    type: "preset",
    tag: "meeting-preference",
    title: "Meeting preference",
    description:
      "Group students by their meeting preference (online or in-person).",
    category: "meetings",
    goal: "similar",
  },
];

const dealbreakerOptions = [
  {
    name: "Lone gender",
    description: "Avoid teams that have for example, one female student.",
    category: "personal",
  },{
    name: "All international students",
    description: "Don't make teams where everyone is an international student.",
    category: "language",
  },{
    name: "Assignment crossover",
    description: "Don't put students together who are already in a team for another assignment.",
    category: "clash",
  },{
    name: "Custom (textual)",
    description: "A custom deal-breaker for a textual spreadsheet column.",
    category: "custom",
    options: ["field", "operation", "missing"],
  },
]

const dealbreakerOptionsOld = [
  {
    type: "preset",
    tag: "lone-gender",
    title: "Lone gender",
    description: "Avoid teams that have for example, one female student.",
    category: "personal",
  },
  {
    type: "preset",
    tag: "all-international",
    title: "All international students",
    description: "Don't make teams where everyone is an international student.",
    category: "language",
  },
  {
    type: "preset",
    tag: "inter-module-clash",
    title: "Crossover with other assignments",
    description: "Don't put students together who are already in a team for another assignment.",
    category: "clash",
  }
];

const criteriaOptionsMap = new Map(criteriaOptionsOld.map((option) => [option.tag, option]));
const dealbreakerOptionsMap = new Map(dealbreakerOptionsOld.map((option) => [option.tag, option]));

exports.criteriaOptions = criteriaOptions;
exports.criteriaOptionsMap = criteriaOptionsMap;
exports.dealbreakerOptions = dealbreakerOptions;
exports.dealbreakerOptionsMap = dealbreakerOptionsMap;
