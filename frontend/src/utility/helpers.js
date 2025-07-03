import { Check2All, ClipboardData, RocketTakeoff, Shuffle, Tools } from "react-bootstrap-icons";

// From: https://stackoverflow.com/a/22193094
export function toTitleCase(string) {
  if (string == null || string.length === 0) return "";
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
    name: "Getting ready",
    icon: Tools,
    colour: {
      student: "secondary",
      supervisor: "secondary",
      lecturer: "primary",
    },
  },
  {
    id: "allocation-questions",
    name: "Allocation questions",
    icon: ClipboardData,
    colour: {
      student: "primary",
      supervisor: "secondary",
      lecturer: "secondary",
    },
  },
  {
    id: "allocation",
    name: "Finalising allocation",
    icon: Shuffle,
    colour: {
      student: "secondary",
      supervisor: "secondary",
      lecturer: "primary",
    },
  },
  {
    id: "live",
    name: "Working in teams",
    icon: RocketTakeoff,
    colour: {
      student: "success",
      supervisor: "success",
      lecturer: "success",
    },
  },
  {
    id: "closed",
    name: "Finished",
    icon: Check2All,
    colour: {
      student: "dark",
      supervisor: "dark",
      lecturer: "dark",
    },
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

export function reduceArrayToObject(inputArray) {
  return inputArray.reduce((accumulator, currentItem) => {
    accumulator[currentItem.name] = currentItem.rating;
    return accumulator;
  }, {});
} 
