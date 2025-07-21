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

exports.calculateAverage = (numbers) => {
  return (numbers.reduce((sum, num) => sum + num, 0) / numbers.length).toFixed(2);
}

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
  }, [])[0];
  return result || "Skills not rated";
};

exports.checkinStatisticsOld = (effortPoints) => {
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

/**
 * Generates a summary about a check-in from a set of data. Supply a lean set of
 * checkin objects for a single peer review point.
 * @param {*} reviews 
 */
exports.checkinStatistics = (reviews) => {
  if (!reviews) return null;
  const netScores = {};
  // Expected score is what a student would get overall if everyone gave them 4
  const expectedScore = reviews.length * 4;
  reviews.forEach(review => {
    for (const recipient in review.effortPoints) {
      if (!netScores[recipient]) netScores[recipient] = 0;
      netScores[recipient] += review.effortPoints[recipient];
    }
  });
  const totalScores = {...netScores};
  for (const recipient in netScores) {
    netScores[recipient] -= expectedScore;
  }
  return {netScores, totalScores};
};

/**
 * Generates a summary of the peer-reviewed skills from a set of data. Supply a
 * lean set of checkin objects for a single peer review point. Outputs an object
 * with recipient IDs as keys, and values being another object with the list of
 * received skill ratings for each skill area. For example:
 * 
 * {
    "685575d4dd782a2174c0b3e0": {
      "Communication": [3, 5, 5],
      "Willingness to help": [1, 2, 4],
      "Java programming": [2, 4, 3],
      "Writing": [2, 4, 5]
    }, ... and so on
 */
exports.peerReviewSkillsStatistics = (checkins, averages=false) => {
  const reviewsByRecipients = {};
  // Iterate through each of the checkins (each submitted by a different person)
  checkins.forEach(checkin => {
    // For each checkin, iterate through the reviews they gave to others
    if (!checkin.reviews) return;
    Object.keys(checkin.reviews).forEach(recipient => {
      if (!reviewsByRecipients.hasOwnProperty(recipient)) {
        reviewsByRecipients[recipient] = {};
      }
      const givenSkills = checkin.reviews[recipient].skills
      Object.keys(givenSkills).forEach(skill => {
        if (reviewsByRecipients[recipient].hasOwnProperty(skill)) {
          reviewsByRecipients[recipient][skill].push(givenSkills[skill]);
        } else {
          reviewsByRecipients[recipient][skill] = [givenSkills[skill]];
        }
      });
    });
  });
  if (averages) {
    const reviewsAverages = {};
    Object.keys(reviewsByRecipients).forEach(recipient => {
      reviewsAverages[recipient] = Object.keys(reviewsByRecipients[recipient]).reduce((acc, skill) => {
        acc[skill] = this.calculateAverage(reviewsByRecipients[recipient][skill]);
        return acc;
      }, {});
    });
    return reviewsAverages
  } else {
    return reviewsByRecipients;
  }
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

exports.daysBetween = (timestamp1, timestamp2) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  const differenceInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  const differenceInDays = differenceInMilliseconds / millisecondsInDay;
  return Math.floor(differenceInDays);
}

exports.hoursSince = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const hoursDifference = Math.floor((now - date) / (1000 * 60 * 60));
  return hoursDifference;
}

exports.generateRandomString = (length) => {
  return Math.random().toString(36).substring(2, length + 2);
}
