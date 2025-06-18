exports.calculateStats = (values) => {
  // Fallback for empty values
  if (!Array.isArray(values) || values.length === 0)
    return {
      min: null,
      lowerQuartile: null,
      median: null,
      upperQuartile: null,
      max: null,
      mean: null,
    };
  values.sort();
  const sum = values.reduce(
    (runningTotal, current) => runningTotal + current,
    0,
  );
  const meanAvg = sum / values.length;
  const min = Math.min(values);
  const max = Math.max(values);
  const midPoint = Math.floor(values.length / 2);
  const median = values[midPoint];
};

exports.bestWorstSkill = (skills, best = true, requiredSkills = []) => {
  if (skills.length === 0) return "Skills not rated";
  const result =  Object.entries(skills).reduce(([prevSkill, prevRating], [skill, rating]) => {
    if (!requiredSkills.includes(skill)) {
      if (prevSkill) return [prevSkill, prevRating];
      return [null, null];
    }
    if (best) {
      return (prevRating && prevRating >= rating) ? [prevSkill, prevRating] : [skill, rating];
    } else {
      return (prevRating && prevRating <= rating) ? [prevSkill, prevRating] : [skill, rating];
    }
  })[0];
  return result || "Skills not rated";
};

exports.checkinStatistics = (effortPoints) => {
  if (!effortPoints) return null;
  const netScores = {};
  const expectedScore = Object.keys(effortPoints).length * 4;
  for (const rater in effortPoints) {
    for (const recipient in effortPoints[rater]) {
      if (netScores[recipient] == null) netScores[recipient] = 0;
      netScores[recipient] += effortPoints[rater][recipient];
    }
  }
  const totalScores = {...netScores};
  for (const recipient in netScores) {
    netScores[recipient] -= expectedScore;
  }
  return {netScores, totalScores};
};

exports.daysSince = (timestamp, numeric=true) => {
  const now = new Date();
  const date = new Date(timestamp);
  const daysDifference = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (numeric) return daysDifference;
  if (daysDifference === 0) return "today";
  if (daysDifference === 1) return "yesterday";
  return `${daysDifference} days ago`;
}

exports.generateRandomString = (length) => {
  return Math.random().toString(36).substring(2, length + 2);
}
