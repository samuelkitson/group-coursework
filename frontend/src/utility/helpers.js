// From: https://stackoverflow.com/a/22193094
export function toTitleCase(string) {
  return string
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ");
}

export function extractNameParts(fullName) {
  const parts = fullName.trim().split(" ");
  if (parts.length === 0) return "Unknown name";
  if (parts[0].endsWith(".")) parts.shift();
  return parts[0];
}

export const ASSIGNMENT_STATES = [
  {
    id: "pre-allocation",
    studentName: "Getting ready",
    staffName: "Setup",
  },
  {
    id: "allocation-questions",
    studentName: "Allocation open",
    staffName: "Allocation questions",
  },
  {
    id: "allocation",
    studentName: "Finalising allocation",
    staffName: "Finalising allocation",
  },
  {
    id: "live",
    studentName: "Working in teams",
    staffName: "Live",
  },
  {
    id: "closed",
    studentName: "Finished",
    staffName: "Finished",
  },
];

export const EMOJI_RATINGS = [
  { emoji: "😓", text: "Not at all confident" },
  { emoji: "😕", text: "Not very confident" },
  { emoji: "😐", text: "Somewhat confident" },
  { emoji: "🙂", text: "Moderately confident" },
  { emoji: "😄", text: "Quite confident" },
  { emoji: "😁", text: "Very confident" },
  { emoji: "😎", text: "Expert level" },
];

export function nextAssignmentState(currentState) {
  const currentIndex = ASSIGNMENT_STATES.findIndex(
    (s) => s.id === currentState,
  );
  if (currentIndex === -1) return null;
  if (currentIndex + 1 >= ASSIGNMENT_STATES.length) return null;
  return ASSIGNMENT_STATES[currentIndex + 1];
}

export function previousAssignmentState(currentState) {
  const currentIndex = ASSIGNMENT_STATES.findIndex(
    (s) => s.id === currentState,
  );
  if (currentIndex === -1) return null;
  if (currentIndex === 0) return null;
  return ASSIGNMENT_STATES[currentIndex - 1];
}

export const chartColours = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
]; 
