const { AllocationError } = require("../errors/errors");

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

function countOccurences(data) {
  const occurences = {};
  data.forEach((x) => {
    occurences[x] = (occurences[x] || 0) + 1;
  });
  return occurences;
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
    if (this.students.length < this.groupSize)
      throw new AllocationError(`The group size must be at most ${this.students.length} for this class size.`);
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
    let groupsCount;
    if (this.surplusLargerGroups) {
      // If creating larger groups in case of uneven student numbers.
      groupsCount = Math.floor(shuffled.length / this.groupSize);
    } else {
      // If creating smaller groups in case of uneven student numbers.
      groupsCount = Math.ceil(shuffled.length / this.groupSize);
    }
    // Create the correct number of empty groups.
    const allocation = Array.from({ length: groupsCount }, () => {return {members: []}});
    // Allocate students to groups from the shuffled list in a "round-robin"
    // style, which makes sure that groups have at most one missing member.
    let groupCounter = 0;
    for (let i = 0; i < shuffled.length; i++) {
      allocation[groupCounter].members.push(shuffled[i]);
      groupCounter += 1;
      if (groupCounter === groupsCount) groupCounter = 0;
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
   * Calculate the fitness according to a specific criterion for a group
   * @param {*} group Group of student ID
   * @param {*} criterion The criterion to evaluate against
   */
  groupCriterionFitness(group, groupDetails, criterion) {
    if (criterion["name"] === "Past performance") {
      const datasetAvg = this.getDatasetStatistic("marks-mean");
      const datasetRange = this.getDatasetStatistic("marks-range");
      const marks = groupDetails.map((student) => student["marks"] ?? datasetAvg);
      const groupRange = range(marks);
      const groupAvg = meanAverage(marks);
      if (criterion["goal"] === "diverse") {
        // Keep group average mark close to the cohort average mark.
        return 1 - (Math.abs(groupAvg - datasetAvg) / (datasetRange / 2));
      } else if (criterion["goal"] === "similar") {
        // Minimise the range of marks within groups.
        const score = 1 - (groupRange / datasetRange);
        return logistic(score, 10, 0.5);
      } else {
        throw new AllocationError(`Invalid goal type "${criterion["goal"]}" for past-performance criterion.`);
      }
    }

    // Comparison to class average
    // High similarity score indicates group avg is similar to class avg
    if (criterion["function"] == "classavg") {
      let attributeValues = groupDetails.map((s) => s[criterion["attribute"]]);
      let groupAvg = meanAverage(attributeValues);
      let datasetAvg = this.getDatasetStatistic(
        criterion["attribute"] + "-mean",
      );
      let datasetRange = this.getDatasetStatistic(
        criterion["attribute"] + "-range",
      );
      let fitness;
      if (datasetRange == 0) {
        fitness = 1;
      } else {
        fitness = Math.abs(groupAvg - datasetAvg) / (datasetRange / 2);
      }
      // console.log("Values: " + attributeValues.toString() + "  Group Avg: " + groupAvg.toString() + "  Dataset Avg: " + datasetAvg.toString() + "  Similarity: " + (1-fitness).toString());
      if (criterion["goal"] == "similar") {
        return 1 - fitness;
      } else if (criterion["goal"] == "diverse") {
        return fitness;
      }
    } else if (criterion["name"] == "Skill coverage") {
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
    } else if (criterion["tag"] == "meeting-preference") {
      // Where students have a preference for online vs in-person, try and
      // group them together.
      const preferences = groupDetails.map((s) => s?.meetingPref ?? "either");
      const preferOnline = preferences.filter(p => p === "online").length;
      const preferInPerson = preferences.filter(p => p === "in-person").length;
      // If no conflicting preferences, return 1
      if (preferOnline === 0 || preferInPerson === 0) return 1.0;
      // If conflicting preferences, try to minimise the conflict
      return (Math.max(preferOnline, preferInPerson) / (preferOnline + preferInPerson));
    }
  }

  /**
   * Checks if a specific penalty should be applied to a group
   * @param {*} group A group of student IDs
   * @param {*} penalty The penalty details
   * @returns True if the penalty should be applied to this group
   */
  checkGroupPenalty(group, groupDetails, penalty) {
    if (penalty["tag"] === "all-international") {
      return groupDetails.every((student) => student["international"] || false);
    } else if (penalty["tag"] === "lone-gender") {
      const maleCount = groupDetails.filter((s) => s?.gender === "male").length;
      const femaleCount = groupDetails.filter((s) => s?.gender === "female").length;
      return maleCount == 1 || femaleCount == 1;
    } else if (penalty["tag"] === "inter-module-clash" && this.otherTeamMembers) {
      const teamMembersOtherModules = [...new Set(group.flatMap(id => this.otherTeamMembers[id] || []))];
      // Check for crossovers
      const crossovers = teamMembersOtherModules.filter(id => group.includes(id));
      return crossovers.length > 0; 
    }
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
      this.dealbreakers.forEach((p) => {
        if (this.checkGroupPenalty(group.members, groupDetails, p)) {
          // console.log("Penalty applied");
          tempFitness = tempFitness * (1 - p["penalty"]);
          group["dealbreakers"].push(p["name"]);
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

  run() {
    const studentIds = this.students.map(s => s._id);
    for (let round = 0; round < this.rounds; round++) {
      // STEP 1: Fitness evaluation
      this.computePopulationFitness();
      // console.log(this.population);
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
        // Randomly select 2 parent allocations to create a child allocation from
        const indexA = Math.floor(Math.random() * parentsMaxIndex);
        const indexB = Math.floor(Math.random() * parentsMaxIndex);
        if (indexA == indexB) continue;
        const parentA = this.population[indexA].allocation;
        const parentB = this.population[indexB].allocation;
        // Combine groups from both parents and sort by the group fitness
        const combinedGroups = [...parentA, ...parentB];
        combinedGroups.sort((a, b) => b.fitness - a.fitness);
        // Keep track of assigned students in the child allocation
        const assigned = new Set();
        const childGroups = [];
        for (const group of combinedGroups) {
          // Skip over this group if any of the students have already been allocated
          if (group.members.some(s => assigned.has(s))) {
            // console.log(`Crossover: skipping group ${group.fitness}`);
            continue
          };
          // Copy the group to the child allocation and mark the students as allocated
          const copiedGroup = {members: [...group.members]};
          copiedGroup.members.forEach(s => assigned.add(s));
          childGroups.push(copiedGroup);
          // console.log(`Crossover: adding group ${group.fitness}`);
        }
        // Now handle the leftover students who haven't been allocated. Start by
        // making as many new full groups as possible.
        const unassignedStudents = studentIds.filter(s => !assigned.has(s));
        const fullGroupsToCreate = Math.floor(unassignedStudents.length / this.groupSize);
        for (let j=0; j<fullGroupsToCreate; j++) {
          childGroups.push({ members: unassignedStudents.splice(0, this.groupSize)});
        }
        // With the other leftover students, allocate them round-robin style to
        // the emptiest remaining groups.
        let groupCounter = 0;
        while (unassignedStudents.length > 0) {
          if (groupCounter == childGroups.length) groupCounter = 0;
          childGroups[groupCounter].members.push(unassignedStudents.pop());
        }
        this.population.push({ allocation: childGroups });
        // console.log("Crossover: done");
      }
      // STEP 4: Mutation
      let mutants = [];
      let mutantsNeeded = Math.max(3, (this.populationTargetSize - this.population.length - elites.length) / 2);
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
      this.population = Array.from(
        new Map(
          this.population.map((obj) => [JSON.stringify(obj), obj]),
        ).values(),
      );
      // STEP 7: Cutting down to the target population size
      this.population.sort((a, b) => b.fitness - a.fitness);
      this.population = this.population.slice(0, this.populationTargetSize);
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
  countOccurences,
  AllocationAlgorithm,
};
