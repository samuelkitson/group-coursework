/**
 * The options attribute determines which (if any) form controls appear for the
 * user on the allocation control page for the criterion. They are:
 *   - attribute: a text box that allows the user to specify a dataset column
 *   - goal: a dropdown/selector to choose between similar or diverse together
 *   - ignoreMissing: a checkbox that if selected ignores ignoreMissing values, and if
 *       not selected treats empty values as a value in itself
 * 
 * There are a few description fields used in various ways.
 *   - description: the basic description shown in the selector
 *   - fillerText: preceded by "Group together " or "Split up " (optional, only if goal is selectable)
 */

const criteriaOptions = [
  {
    name: "Skill coverage",
    description: "Teams have someone confident in each required skill.",
    category: "skills",
  },{
    name: "Past performance",
    description: "Allocate based on students' past performance and marks.",
    fillerText: "students with similar past performance.",
    category: "data",
    options: ["goal"],
  },{
    name: "Degree programme",
    description: "Allocate using students' degree programmes.",
    fillerText: "students on the same degree programme.",
    category: "data",
    options: ["goal"],
  },{
    name: "Enrolment",
    description: "Group together or split up students who are unenrolled.",
    fillerText: "students who aren't yet enrolled.",
    category: "data",
    options: ["goal"],
  },{
    name: "Meeting preference",
    description: "Split up students who prefer to meet online and in-person.",
    category: "personal",
  },{
    name: "International",
    description: "Group international students together or split them up.",
    fillerText: "international students.",
    category: "language",
    options: ["goal"],
  },{
    name: "Custom (textual)",
    description: "A custom criterion for a textual dataset column.",
    category: "custom",
    options: ["attribute", "goal", "ignoreMissing"],
  },{
    name: "Custom (numeric)",
    description: "A custom criterion for a numeric dataset column.",
    category: "custom",
    options: ["attribute", "goal", "ignoreMissing"],
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
    description: "A custom deal-breaker for a textual dataset column.",
    category: "custom",
    options: ["attribute", "operator", "operand", "ignoreMissing"],
  },
];

const criteriaOptionsMap = new Map(criteriaOptions.map((option) => [option.name, option]));
const dealbreakerOptionsMap = new Map(dealbreakerOptions.map((option) => [option.name, option]));

exports.criteriaOptions = criteriaOptions;
exports.criteriaOptionsMap = criteriaOptionsMap;
exports.dealbreakerOptions = dealbreakerOptions;
exports.dealbreakerOptionsMap = dealbreakerOptionsMap;
