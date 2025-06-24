export function timestampToHumanFriendly (timestamp) {
  const date = new Date(timestamp);
  const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${dayName} ${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function daysSince (timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const daysDifference = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  return daysDifference;
}

export function hoursSince (timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const hoursDifference = Math.floor((now - date) / (1000 * 60 * 60));
  return hoursDifference;
}

export function timeOfDayName() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 18) {
    return "afternoon";
  } else {
    return "evening";
  }
}
