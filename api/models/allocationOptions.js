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
 * 
 * - attribute: if this data comes from a dataset upload, the name of the column
 */

const criteriaOptions = [
  {
    name: "Skill coverage",
    description: "Teams have someone with above average confidence in each required skill.",
    category: "skills",
  },{
    name: "Past performance",
    description: "Allocate based on students' past performance and marks.",
    category: "data",
    options: ["goal"],
    attribute: "marks",
    type: "numeric",
  },{
    name: "Degree programme",
    description: "Allocate using students' degree programmes.",
    category: "data",
    options: ["goal"],
    attribute: "degree",
    type: "textual",
  },{
    name: "Enrolment",
    description: "Group together or split up students who are unenrolled."
    category: "data",
    options: ["goal"],
    attribute: "enrolled ",
    type: "boolean",
  },{
    name: "Meeting preference",
    description: "Split up students who prefer to meet online and in-person.",
    category: "personal",
  },{
    name: "International",
    description: "Group international students together or split them up.",
    category: "language",
    options: ["goal"],
    attribute: "international",
    type: "boolean",
  },{
    name: "Custom (textual)",
    description: "A custom criterion for a textual dataset column.",
    category: "custom",
    options: ["attribute", "goal", "ignoreMissing"],
    type: "textual",
  },{
    name: "Custom (numeric)",
    description: "A custom criterion for a numeric dataset column.",
    category: "custom",
    options: ["attribute", "goal", "ignoreMissing"],
    type: "numeric",
  },{
    name: "Custom (boolean)",
    description: "A custom criterion for a boolean dataset column.",
    category: "custom",
    options: ["attribute", "goal"],
    type: "boolean",
  }
];

const dealbreakerOptions = [
  {
    name: "Lone gender",
    description: "Avoid teams that have exactly one male, female or non-binary student.",
    category: "personal",
    attribute: "gender",
    type: "textual",
  },{
    name: "Lone female/non-binary",
    description: "Specifically avoid teams with only one female or non-binary student. Allows teams with one male student.",
    category: "personal",
    attribute: "gender",
    type: "textual",
  },{
    name: "All international students",
    description: "Don't make teams where everyone is an international student.",
    category: "language",
    attribute: "international",
    type: "boolean",
  },{
    name: "Assignment crossover",
    description: "Don't put students together who are already in a team for another assignment.",
    category: "clash",
  },{
    name: "Custom (textual)",
    description: "A custom deal-breaker for a textual dataset column.",
    category: "custom",
    options: ["attribute", "operator", "operand", "ignoreMissing"],
    type: "textual",
  },{
    name: "Custom (numeric)",
    description: "A custom deal-breaker for a numeric dataset column.",
    category: "custom",
    options: ["attribute", "operator", "operand"],
    type: "numeric",
  },{
    name: "Custom (boolean)",
    description: "A custom deal-breaker for a boolean dataset column.",
    category: "custom",
    options: ["attribute", "operator", "operand"],
    type: "boolean",
  },
];

const criteriaOptionsMap = new Map(criteriaOptions.map((option) => [option.name, option]));
const dealbreakerOptionsMap = new Map(dealbreakerOptions.map((option) => [option.name, option]));

exports.criteriaOptions = criteriaOptions;
exports.criteriaOptionsMap = criteriaOptionsMap;
exports.dealbreakerOptions = dealbreakerOptions;
exports.dealbreakerOptionsMap = dealbreakerOptionsMap;
