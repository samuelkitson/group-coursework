const { AllocationError, InvalidParametersError } = require("../errors/errors");

/**
 * Shuffles the input array in-place.
 * From: https://www.geeksforgeeks.org/how-to-shuffle-an-array-using-javascript/
 * @param {Array<Object>} inputArr
 * @returns
 */
function shuffleArray(inputArr) {
  for (let i = inputArr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let t = inputArr[i];
    inputArr[i] = inputArr[j];
    inputArr[j] = t;
  }
  return inputArr;
}

function sumArray(inputArr) {
  return inputArr.reduce((partial, a) => partial + (a || 0), 0);
}

function multiplyArrays(arr1, arr2) {
  return arr1.map((val, i) => val * arr2[i] ?? 0)
}

/**
 * From: https://stackoverflow.com/questions/10359907/how-to-compute-the-sum-and-average-of-elements-in-an-array
 * @param {Array<Integer>} inputArr Array of integers
 * @returns {Integer} Mean average of input
 */
function meanAverage(inputArr) {
  return sumArray(inputArr) / inputArr.length || 0;
}

function variance(data) {
  const avg = meanAverage(data);
  return data.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / data.length;
}

function standardDeviation(data) {
  return Math.sqrt(variance(data));
}

function range(data) {
  return Math.max(...data) - Math.min(...data);
}

function avgPairwiseDistance(data) {
  if (data.length <= 1) return 0;
  let distanceSum = 0;
  let pairs = 0;
  for (let i=0; i < data.length; i++) {
    for (let j=1+1; j < data.length; j++) {
      distanceSum += Math.abs(data[i] - data[j]);
      pairs++;
    }
  }
  return distanceSum / pairs;
}

function countOccurrences(data) {
  const occurrences = {};
  data.forEach((x) => {
    occurrences[x] = (occurrences[x] || 0) + 1;
  });
  return occurrences;
}

function getMostCommonFrequency(data) {
  if (data.length === 0) return 0;
  const frequencyMap = new Map();
  let maxFrequency = 0;
  for (const item of data) {
    const currentCount = (frequencyMap.get(item) || 0) + 1;
    frequencyMap.set(item, currentCount);
    if (currentCount > maxFrequency) {
      maxFrequency = currentCount;
    }
  }
  return maxFrequency;
}

function logistic(x, steepness, offset) {
  return 1 / (1 + Math.pow(Math.E, -1 * steepness * (x - offset)));
}

// Need to cite
function binomialChoose(n, k) {
  if (k > n || k < 0) return 0; // Handle invalid inputs
  if (k === 0 || k === n) return 1; // Base cases

  k = Math.min(k, n - k); // Take advantage of symmetry: C(n, k) = C(n, n-k)

  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= n - (i - 1);
    result /= i;
  }
  return result;
}

/**
 * A fast way to hash MongoDB ObjectIds to 32 bit integers.
 * @param {ObjectId} objectId A MongoDB 12 byte ObjecctId (as a 24 character
 * hex string).
 * @returns {uint32} Unsigned 32 bit integer.
 */
function objectIdTo32Int(objectId) {
  let h = 0;
  // Split the 24 hex chars into 3 chunks of 8 (32 bits each).
  // XOR these together to produce a single 32 bit integer.
  for (let i = 0; i < objectId.length; i += 8) {
    h ^= parseInt(objectId.slice(i, i + 8), 16) >>> 0;
  }
  // Multiply by a mixing constant to shuffle the bits around.
  return Math.imul(h, 0x9e3779b1) >>> 0;
}

function generateAllocationHash(allocation) {
  // For each group, XOR the member ObjectId hashes together. XOR is important
  // because the order doesn't matter, so the same group hash is generated no
  // matter the order of the members within.
  const groupHashes = allocation.allocation.map(group => {
    let gh = 0;
    for (const id of group.members) {
      gh ^= objectIdTo32Int(id);
    }
    return gh >>> 0;
  });
  // Sort the group hashes, as the order of groups within the allocation doesn't
  // matter.
  groupHashes.sort((a, b) => a - b);
  // Combine the group hashes with XOR, and multiply by a mixing constant again.
  // The multiply after each XOR helps to mix the bits around and ensure hashes
  // are spread out.
  // 3. Combine all group hashes with XOR + prime multiply
  let finalHash = 0;
  for (const gh of groupHashes) {
    finalHash = Math.imul(finalHash ^ gh, 0x9e3779b1) >>> 0;
  }
  return finalHash >>> 0;
}

class AllocationAlgorithm {
  // Configurable parameters
  selectionPercent = 0.4;
  elitistPercent = 0.2;
  rounds = 50;
  mutationPercent = 0.3;
  populationTargetSize = 50;

  students = [];
  studentsMap = new Map();
  criteria = [];
  dealbreakers = [];
  groupSize = 1;
  surplusLargerGroups = false;
  otherTeamMembers = null;
  studentIDs = [];
  population = [];
  datasetStatistics = {};
  fitnessAggregation = "minimum"; // average/minimum/maximum
  groupsNeeded = 0;

  constructor({ studentData, criteria, dealbreakers, groupSize, surplusLargerGroups, otherTeamMembers, fitnessAggregation="minimum", }) {
    this.students = studentData;
    this.studentsMap = new Map(studentData.map(s => [s?._id, s]));
    this.criteria = criteria;
    this.dealbreakers = dealbreakers;
    this.groupSize = groupSize;
    this.surplusLargerGroups = surplusLargerGroups;
    this.otherTeamMembers = otherTeamMembers;
    this.studentIDs = studentData.map((s) => s._id);
    this.fitnessAggregation = fitnessAggregation ?? "minimum";
    if (this.students.length <= this.groupSize)
      throw new InvalidParametersError(`The group size must be at most ${this.students.length - 1} for this class size.`);
    if (surplusLargerGroups) {
      // If creating larger groups in case of uneven student numbers.
      this.groupsNeeded = Math.floor(studentData.length / this.groupSize);
    } else {
      // If creating smaller groups in case of uneven student numbers.
      this.groupsNeeded = Math.ceil(studentData.length / this.groupSize);
    }
  }

  /**
   * Used for commonly used statistics about the overall student dataset, such
   * as the overall variance in marks. If the statistic has already been
   * calculated, it will be returned. If not, it will be calculated.
   * Naming convention: attribute-measure, e.g. averageGrade-variance
   * @param {*} statistic The requested statistic
   */
  getDatasetStatistic(statistic) {
    if (!(statistic in this.datasetStatistics)) {
      const [attribute, measure] = statistic.split("-");
      let values = [];
      if (attribute.startsWith("skill:")) {
        const skillName = attribute.substring("skill:".length);
        values = this.students.map((s) => s.skills[skillName]).filter(v => Number.isInteger(v));
      } else {
        values = this.students.map((s) => s[attribute]);
      }
      let value = 0;
      if (measure == "stddev") {
        value = standardDeviation(values);
      } else if (measure == "mean") {
        value = meanAverage(values);
      } else if (measure == "range") {
        value = range(values);
      } else if (measure == "proportiontrue") {
        if (values.length == 0) {
          values = 1;
        } else {
          value = values.filter(Boolean).length / values.length;
        }
      } else if (measure == "uniques") {
        const occurrences = countOccurrences(values);
        value = Object.keys(occurrences).length;
      }
      this.datasetStatistics[statistic] = value;
    }
    return this.datasetStatistics[statistic];
  }

  studentDetails(studentID) {
    return this.students.find((s) => s._id === studentID);
  }

  /**
   * Randomly generates an allocation of students to groups. Obeys the flag to
   * create larger or smaller groups as necessary (if the number of students
   * won't divide evenly).
   * 
   * @returns An array of team objects, each with a members array containing student IDs.
   */
  createRandomAllocation() {
    // Copy the list of student IDs and shuffle.
    let shuffled = shuffleArray([...this.studentIDs]);
    // Create the correct number of empty groups.
    const allocation = Array.from({ length: this.groupsNeeded }, () => {return {members: []}});
    // Allocate students to groups from the shuffled list in a "round-robin"
    // style, which makes sure that groups have at most one missing member.
    let groupCounter = 0;
    for (let i = 0; i < shuffled.length; i++) {
      allocation[groupCounter].members.push(shuffled[i]);
      groupCounter += 1;
      if (groupCounter === this.groupsNeeded) groupCounter = 0;
    }
    // Return the generated allocation.
    return allocation;
  }

  /**
   * Generates the initial population, represented by a list of length
   * populationTargetSize containing allocations randomly generated by 
   * createRandomAllocation.
   */
  createInitialPopulation() {
    this.population = Array.from({ length: this.populationTargetSize }, () => {
      return { allocation: this.createRandomAllocation() };
    });
  }

  /**
   * Deduplicates a list of allocations by using the canonical string
   * represenation.
   * @param {list} allocations The population of allocation.
   * @returns The deduplicated list.
   */
  deduplicateAllocations(allocations) {
    const uniques = new Map();
    for (const allocation of allocations) {
      const hash = generateAllocationHash(allocation);
      if (!uniques.has(hash)) {
        uniques.set(hash, allocation);
      }
    }
    return Array.from(uniques.values());
  }

  /**
   * Calculate the fitness according to a specific criterion for a group
   * @param {*} group Group of student ID
   * @param {*} criterion The criterion to evaluate against
   */
  groupCriterionFitness(group, groupDetails, criterion) {
    if (criterion["name"] == "Skill coverage") {
      // Aim for at least one member to be confident in each skill
      // For each skill, get the maximum score within the group and scale with
      // a logistic curve (assuming skills are rated 1-7). This makes high
      // ratings near equivalent. Then return the lowest skill logistic.
      let skillRatings = groupDetails.map((s) => s["skills"] ?? []);
      let bestRatings = [];
      let topScorers = new Array(groupDetails.length).fill(0);
      criterion["skills"].forEach((skill) => {
        const ratings = skillRatings.map((s) => s[skill] ?? this.getDatasetStatistic(`skill:${skill}-mean`, true));
        const topRating = Math.max(...ratings);
        // This logistic curves means that a skill rating that's average for the
        // class receives a skill score of 50%. 1 above average gets 82% and 2
        // above average gets 95%.
        const skillScore = topRating == 7 ? 1 : logistic(topRating, 1, this.getDatasetStatistic(`skill:${skill}-mean`));
        // Apply a small penalty if the group's average rating is quite
        // different to the class average. This helps more balanced groups to
        // form.
        const groupAvg = meanAverage(ratings);
        const classAvg = this.getDatasetStatistic(`skill:${skill}-mean`, true);
        const balancePenalty = Math.max(0.7, 1 - (1/10) * Math.pow((groupAvg-classAvg), 2));
        bestRatings.push(skillScore * balancePenalty);
      });
      // The criterion fitness score is the group's lowest skill score. The aim
      // of this is to ensure that groups have confidence in each listed skill.
      return Math.min(...bestRatings);
    } else if (criterion["name"] == "Meeting preference") {
      // Where students have a preference for online vs in-person, try and
      // group them together.
      const preferences = groupDetails.map((s) => s?.meetingPref ?? "either");
      const preferOnline = preferences.filter(p => p === "online").length;
      const preferInPerson = preferences.filter(p => p === "in-person").length;
      // If no conflicting preferences, return 1
      if (preferOnline === 0 || preferInPerson === 0) return 1.0;
      // If conflicting preferences, try to minimise the conflict
      return (Math.max(preferOnline, preferInPerson) / (preferOnline + preferInPerson));
    } else {
      const dataType = criterion?.type ?? "textual";
      if (dataType === "textual") {
        const values = criterion?.ignoreMissing ? groupDetails.map(s => s?.[criterion.attribute]).filter(v => v !== null) : groupDetails.map(s => s?.[criterion.attribute]);
        if (values.length == 0) return 1;
        const occurrences = countOccurrences(values);
        if (criterion.goal === "similar") {
          const maxCount = Math.max(...Object.values(occurrences));
          return maxCount / values.length;
        } else if (criterion.goal === "diverse") {
          if (values.length <= 1) return 1;
          const datasetUniques = this.getDatasetStatistic(`${criterion.attribute}-uniques`);
          if (datasetUniques <= 1) return 1;
          const uniques = Object.keys(occurrences).length;
          return (uniques - 1) / (datasetUniques - 1);
        }
      } else if (dataType === "boolean") {
        const trues = groupDetails.filter(s => s?.[criterion.attribute]).length;
        const falses = groupDetails.length - trues;
        if (trues + falses == 0) return 1;
        const classPropTrue = this.getDatasetStatistic(`${criterion.attribute}-proportiontrue`);
        if (criterion.goal === "group-true") {
          if (trues === 0) return 1;
          return trues / (trues + falses);
        } else if (criterion.goal === "group-false") {
          if (falses === 0) return 1;
          return falses / (trues + falses);
        } else if (criterion.goal === "separate-true") {
          // Penalise if the group's true proportion is higher than the class
          // true proportion. Prevents over-represetation.
          if (trues <= 1) return 1;
          const groupPropTrue = trues / (trues + falses);
          if (groupPropTrue <= classPropTrue) return 1;
          return 1 - ((groupPropTrue - classPropTrue) / (1 - classPropTrue));
        } else if (criterion.goal === "separate-false") {
          // The same as above but in reverse.
          if (falses <= 1) return 1;
          const classPropFalse = 1 - classPropTrue;
          const groupPropFalse = falses / (trues + falses);
          if (groupPropFalse <= classPropFalse) return 1;
          return 1 - ((groupPropFalse - classPropFalse) / (1 - classPropFalse));
        } else if (criterion.goal === "similar") {
          // Simplified version of the "similar" function for discrete.
          return (Math.max(trues, falses) / groupDetails.length);
        } else if (criterion.goal === "proportional") {
          // Get the group's true proportion to be as close to the cohort true
          // proportion as possible.
          const groupPropTrue = trues / (trues + falses);
          return 1 - (Math.abs(groupPropTrue - classPropTrue) / Math.max(classPropTrue, 1 - classPropTrue));
        }
      } else if (dataType === "numeric") {
        const values = criterion?.ignoreMissing ? groupDetails.map(s => s?.[criterion.attribute]).filter(v => v !== null) : groupDetails.map(s => s?.[criterion.attribute]);
        if (values.length == 0) return 1;
        if (criterion.goal === "similar") {
          // Minimise the range of values in this group, compared to the cohort.
          const datasetRange = this.getDatasetStatistic(`${criterion.attribute}-range`);
          const groupRange = range(values);
          if (datasetRange <= 0 || groupRange <= 0) return 1;
          const score = 1 - (groupRange / datasetRange);
          if (criterion.name === "Past performance") {
            // For the marks criterion, use quite a steep logistic curve.
            return logistic(score, 10, 0.5);
          }
          return logistic(score, 5, 0.5);
        } else if (criterion.goal === "diverse") {
          // Maximise the standard deviation of the group, in comparison to the
          // standard deviation of the cohort. If the group's standard deviation
          // is higher, just cap the fitness at 1.
          const datasetStdDev = this.getDatasetStatistic(`${criterion.attribute}-stddev`);
          const groupStdDev = standardDeviation(values);
          if (datasetStdDev <= 0 || groupStdDev > datasetStdDev) return 1;
          const score = groupStdDev / datasetStdDev;
          return score;
        } else if (criterion.goal === "average") {
          // Get the group average as close as possible to the cohort average.
          // This may result in some very tight distributions and others more
          // broad.
          const datasetAvg = this.getDatasetStatistic(`${criterion.attribute}-mean`);
          const datasetRange = this.getDatasetStatistic(`${criterion.attribute}-range`);
          const groupAvg = meanAverage(values);
          return 1 - (Math.abs(groupAvg - datasetAvg) / (datasetRange / 2));
        }
      }
    }
  }

  /**
   * Checks if a specific deal-breaker should be applied to a group.
   * @param {*} group A group of student IDs.
   * @param {*} penalty The deal-breaker details.
   * @returns True if the penalty should be applied to this group.
   */
  groupDealbreakerCheck(group, groupDetails, dealbreaker) {
    if (dealbreaker.name === "All international students") {
      return groupDetails.every((student) => student?.international || false);
    } else if (["Lone gender", "Lone female/non-binary"].includes(dealbreaker.name)) {
      const groupGenders = groupDetails.map(s => s?.gender).filter(g => g !== null);
      const genders = countOccurrences(groupGenders);
      const maleCount = genders?.male ?? 0;
      const femaleCount = genders?.female ?? 0;
      const nbCount = groupGenders.length - maleCount - femaleCount;
      if (dealbreaker.name === "Lone gender" && [maleCount, femaleCount, nbCount].includes(1)) return true;
      if (dealbreaker.name === "Lone female/non-binary" && femaleCount + nbCount === 1) return true;
      return false;
    } else if (dealbreaker.name === "Assignment crossover" && this.otherTeamMembers) {
      const teamMembersOtherModules = [...new Set(group.flatMap(id => this.otherTeamMembers[id] || []))];
      // Check for crossovers between this assignment and others.
      const crossovers = teamMembersOtherModules.filter(id => group.includes(id));
      return crossovers.length > 0; 
    } else if (dealbreaker.name.startsWith("Custom")) {
      const values = dealbreaker?.ignoreMissing ? groupDetails.map(s => s?.[dealbreaker.attribute]).filter(v => v !== null) : groupDetails.map(s => s?.[dealbreaker.attribute]);
      if (values.length == 0) return false;
      if (dealbreaker?.type === "textual") {
        const occurrences = countOccurrences(values);
        if (dealbreaker?.operator === "max_per_value") {
          const mostFrequent = Math.max(...Object.values(occurrences));
          return mostFrequent > dealbreaker?.operand;
        } else if (dealbreaker?.operator === "min_per_value") {
          const leastFrequent = Math.min(...Object.values(occurrences));
          return leastFrequent < dealbreaker?.operand;
        } else if (dealbreaker?.operator === "max_unique") {
          const uniqueCount = Object.values(occurrences).length;
          return uniqueCount > dealbreaker?.operand;
        } else if (dealbreaker?.operator === "min_unique") {
          const uniqueCount = Object.values(occurrences).length;
          return uniqueCount < dealbreaker?.operand;
        }
      } else if (dealbreaker?.type === "numeric") {
        const sum = sumArray(values) ?? 0;
        if (dealbreaker?.operator === "min_sum") {
          return sum < dealbreaker?.operand;
        } else if (dealbreaker?.operator === "max_sum") {
          return sum > dealbreaker?.operand;
        }
      } else if (dealbreaker?.type === "boolean") {
        const trueCount = values.filter(v => v === true).length;
        const falseCount = values.filter(v => v === false).length;
        if (dealbreaker?.operator === "min_true") {
          return trueCount < dealbreaker?.operand;
        } else if (dealbreaker?.operator === "max_true") {
          return trueCount > dealbreaker?.operand;
        } if (dealbreaker?.operator === "min_false") {
          return falseCount < dealbreaker?.operand;
        } if (dealbreaker?.operator === "max_false") {
          return falseCount > dealbreaker?.operand;
        }
      }
    }
    return false;
  }

  allocationFitness(allocation) {
    let groupFitness = [];
    allocation.forEach((group) => {
      const groupDetails = this.students.filter((s) => group.members.includes(s._id));
      group["criteriaScores"] = [];
      let criteriaScores = this.criteria.map((crit) => {
        const score = this.groupCriterionFitness(group.members, groupDetails, crit);
        group["criteriaScores"].push(score);
        return score;
      });
      let criteriaWeights = this.criteria.map((crit) => crit["priority"]);
      let tempFitness = sumArray(multiplyArrays(criteriaWeights, criteriaScores)) / sumArray(criteriaWeights);
      group["dealbreakers"] = [];
      this.dealbreakers.forEach((dealbreaker) => {
        if (this.groupDealbreakerCheck(group.members, groupDetails, dealbreaker)) {
          tempFitness = tempFitness * (1 - dealbreaker.penalty);
          group["dealbreakers"].push(dealbreaker.name);
        }
      });
      // Flag small and large groups (where numbers aren't perfectly divisible)
      if (group.members.length < this.groupSize) {
        // Apply a small penalty to small groups
        tempFitness = tempFitness * 0.9;
        group["dealbreakers"].push("Small group");
      } else if (group.members.length > this.groupSize) {
        group["dealbreakers"].push("Large group");
      }
      // Check whether any pairing exclusions are present in the group
      const exclusions = [...new Set(groupDetails.flatMap(s => s.noPair || []))];
      const hitExclusions = exclusions.filter(s => group.members.includes(s._id.toString()));
      if (hitExclusions.length > 0) {
        tempFitness = tempFitness * 0.5;
        group["dealbreakers"].push("Pairing exclusion");
      }
      // Save the final fitness for this group
      groupFitness.push(tempFitness);
      group["fitness"] = tempFitness;
    });
    // Use specified aggregation technique for allocation fitness
    switch (this.fitnessAggregation) {
      case "minimum":
        return Math.min(...groupFitness);
      case "maximum":
        return Math.max(...groupFitness);
      case "logistic":
        let adjustedFitnesses = groupFitness.map((f) => logistic(f, 13, 0.65));
        return meanAverage(adjustedFitnesses);
      case "average":
      default:
        return meanAverage(groupFitness);
    }
  }

  computePopulationFitness() {
    this.population = this.population.map((alloc) => {
      alloc["fitness"] = this.allocationFitness(alloc["allocation"]);
      return alloc;
    });
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  crossoverStep(studentIds, parentIndexA, parentIndexB) {
    const parentA = this.population[parentIndexA].allocation;
    const parentB = this.population[parentIndexB].allocation;
    // Combine groups from both parents, sorted by fitness.
    const combinedGroups = [...parentA, ...parentB].sort((a, b) => b.fitness - a.fitness);
    // Work out target group sizes.
    const totalStudents = studentIds.length;
    const base = Math.floor(totalStudents / this.groupsNeeded);
    const remainder = totalStudents % this.groupsNeeded;
    const targetSizes = Array(this.groupsNeeded).fill(base);
    if (this.surplusLargerGroups) {
      for (let i = 0; i < remainder; i++) targetSizes[i] += 1;
    } else {
      for (let i = this.groupsNeeded - remainder; i < this.groupsNeeded; i++) targetSizes[i] += 1;
    }
    // Prepare child groups.
    const childGroups = targetSizes.map(size => ({ members: [], capacity: size }));
    const assigned = new Set();
    // Fill groups with best parent groups where they fit.
    for (const group of combinedGroups) {
      const members = group.members.filter(s => !assigned.has(s));
      for (const cg of childGroups) {
        const space = cg.capacity - cg.members.length;
        if (space >= members.length) {
          cg.members.push(...members);
          members.forEach(s => assigned.add(s));
          break;
        }
      }
    }
    // Put leftover students in remaining spaces.
    const unassigned = studentIds.filter(s => !assigned.has(s));
    let idx = 0;
    for (const s of unassigned) {
      while (childGroups[idx].members.length >= childGroups[idx].capacity) {
        idx = (idx + 1) % this.groupsNeeded;
      }
      childGroups[idx].members.push(s);
      assigned.add(s);
    }
    this.population.push({ allocation: childGroups.map(g => ({ members: g.members })) });
  }

  run() {
    const studentIds = this.students.map(s => s._id);
    for (let round = 0; round < this.rounds; round++) {

      // STEP 1: Fitness evaluation
      this.computePopulationFitness();

      // STEP 2: Selection/elitism
      // Keep only the top % by fitness score
      let elites = JSON.parse(
        JSON.stringify(
          this.population.slice(
            0,
            Math.ceil(this.elitistPercent * this.population.length),
          ),
        ),
      );
      this.population = this.population.slice(
        0,
        Math.ceil(this.selectionPercent * this.population.length),
      );

      // STEP 3: Crossover
      // Keep the parents, and make new children that have the top groups from
      // some randomly selected parent allocations.
      let crossoversNeeded = Math.max(3, (this.populationTargetSize - this.population.length - elites.length) / 2);
      const parentsMaxIndex = this.population.length;
      for (let i = 0; i < crossoversNeeded; i++) {
        // Pick two different parents
        let indexA = Math.floor(Math.random() * parentsMaxIndex);
        let indexB = Math.floor(Math.random() * parentsMaxIndex);
        while (indexB === indexA) indexB = Math.floor(Math.random() * parentsMaxIndex);
        this.crossoverStep(studentIds, indexA, indexB);
      }

      // STEP 4: Mutation
      let mutants = [];
      let mutantsNeeded = Math.max(3, (this.populationTargetSize - this.population.length - elites.length));
      let swapCount = Math.ceil(this.mutationPercent * this.population.length);
      for (let i = 0; i < this.population.length; i++) {
        if (i >= mutantsNeeded) break;
        let original = JSON.parse(
          JSON.stringify(this.population[i].allocation),
        );
        // Break out if only one group
        if (original.length <= 1) break;
        for (let j = 0; j < swapCount; j++) {
          const g1 = Math.floor(Math.random() * original.length);
          const g2 = Math.floor(Math.random() * original.length);
          if (g1 == g2) {
            // Must swap students between groups
            j--;
            continue;
          }
          const s1 = Math.floor(Math.random() * original[g1]["members"].length);
          const s2 = Math.floor(Math.random() * original[g2]["members"].length);
          [original[g1]["members"][s1], original[g2]["members"][s2]] = [
            original[g2]["members"][s2],
            original[g1]["members"][s1],
          ]
        }
        this.population.push({ allocation: original });
      }
      // STEP 5: Elitism
      this.population.push(...elites);
      // STEP 6: Deduplication
      this.population = this.deduplicateAllocations(this.population);
    }
  }

  logBestGroup() {
    console.log("=== BEST ALLOCATION ===");
    console.log("    Fitness " + this.population[0].fitness.toString());
    this.population[0].allocation.forEach((g) => {
      console.log("\n== GROUP ==");
      console.log(
        "Fitness: " +
          g.fitness.toString() +
          ", dealbreakers: " +
          g.dealbreakers.toString() +
          ", criteria scores: " +
          g.criteriaScores.toString(),
      );
      g.members.forEach((s) => {
        console.log(this.studentDetails(s));
      });
    });
  }

  bestAllocationDetails() {
    const withDetails = JSON.parse(JSON.stringify(this.population[0]));
    withDetails.allocation = withDetails.allocation.map(group => {
      group.members = group.members.map(studentId => {
        const studentInfo = this.studentsMap.get(studentId);
        const displayName = studentInfo?.displayName ?? "Unknown Student";
        return {_id: studentId, ...studentInfo, displayName,};
      });
      return group;
    }).sort((a, b) => a.fitness - b.fitness).sort((a, b) => b.dealbreakers.length - a.dealbreakers.length);
    return withDetails;
  }
}

/**
 * Given an array of groups (ie. arrays of student IDs), replace the student IDs
 * with the actual student objects containing their measurable attributes.
 * @param {Array<Object>} students
 * @param {Array<Array<Number>>} groups
 * @returns {Array<Array<Object>>}
 */
function populateGroupArray(students, groups) {
  return groups.map((g) =>
    g.map((p_id) => students.find((po) => po._id === p_id)),
  );
}

function generateGroups(students, criteria) {}

module.exports = {
  generateGroups,
  countOccurrences,
  AllocationAlgorithm,
};
