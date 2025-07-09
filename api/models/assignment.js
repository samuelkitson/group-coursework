const { Schema, Types, model } = require("mongoose");

const skillSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
  },
  { _id: false },
);

const criterionSchema = new Schema(
  {
    tag: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: false },
    priority: { type: Number, required: false },
    goal: { type: String, },
  },
  { _id: false },
);

const dealbreakerSchema = new Schema(
  {
    tag: { type: String, required: true },
    importance: { type: Number, required: true },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    name: String,
    description: String,
    state: {
      type: String,
      enum: [
        "pre-allocation",
        "allocation-questions",
        "allocation",
        "live",
        "closed",
      ],
      default: "pre-allocation",
    },
    lecturers: [{ type: "ObjectId", ref: "user", index: true}],
    students: [{ type: "ObjectId", ref: "user", index: true }],
    supervisors: [{ type: "ObjectId", ref: "user", index: true }],
    skills: [skillSchema],
    allocationCriteria: [criterionSchema],
    allocationDealbreakers: [dealbreakerSchema],
    groupSize: Number,
    surplusLargerGroups: { type: Boolean, default: false },
  },
  { timestamps: true },
);

assignmentSchema.statics.getAssignmentsByUser = async function (userId) {
  const limitedFields = { _id: 1, name: 1, description: 1, state: 1, supervisors: 1, students: 1, lecturers: 1 };
  const userObjectId = new Types.ObjectId(userId);
  // Check for the student role first
  const assignmentsStudents = await this.find(
    {
      students: { $in: [userObjectId] },
    },
    limitedFields,
  ).populate("lecturers", "displayName email role").lean();
  let assignments = assignmentsStudents.map(a => ({...a, role: "student", students: undefined, supervisors: undefined}));
  // Check for the supervisor role next
  const assignmentsSupervisors = await this.find(
    {
      supervisors: { $in: [userObjectId] },
    },
    limitedFields,
  ).populate("lecturers", "displayName email role").lean();
  assignments = assignments.concat(assignmentsSupervisors.map(a => ({...a, role: "supervisor", students: undefined, supervisors: undefined})));
  // Check for the lecturer role last
  const assignmentsLecturers = await this.find(
    {
      lecturers: { $in: [userObjectId] },
    },
  ).populate("lecturers", "displayName email role").lean();
  assignments = assignments.concat(assignmentsLecturers.map(a => ({...a, role: "lecturer"})));
  // Return the combined list
  return assignments;
};

assignmentSchema.statics.findByStudent = async function (
  studentId,
  allFields = false,
) {
  const projection = allFields
    ? {}
    : { _id: 1, name: 1, description: 1, state: 1, lecturers: 1 };
  return this.find(
    {
      students: { $in: [new Types.ObjectId(studentId)] },
    },
    projection,
  ).populate("lecturers", "displayName email");
};

assignmentSchema.statics.findByLecturer = async function (
  lecturerId,
  allFields = false,
) {
  const projection = allFields
    ? {}
    : { _id: 1, name: 1, description: 1, state: 1, lecturers: 1 };
  return this.find(
    {
      lecturers: { $in: [new Types.ObjectId(lecturerId)] },
    },
    projection,
  ).populate("lecturers", "displayName email");
};

assignmentSchema.statics.findBySupervisor = async function (
  supervisorId,
  allFields = false,
) {
  const projection = allFields
    ? {}
    : { _id: 1, name: 1, description: 1, state: 1, lecturers: 1 };
  return this.find(
    {
      supervisors: { $in: [new Types.ObjectId(supervisorId)] },
    },
    projection,
  ).populate("lecturers", "displayName email");
};

/**
 * Check whether a user with a given ID is registered on a specific assignment.
 * This method allows you to check whether a user has a specific role on an
 * assignment by providing the role parameter, or whether they have any role on
 * it by setting role to null.
 * @param {ObjectId} assignmentId the ID of the assignment.
 * @param {ObjectId} userId the ID of the user.
 * @param {string|null} role "student", "lecturer", "supervisor" or null.
 * @returns {boolean} true if the details were verified.
 */
assignmentSchema.statics.isUserOnAssignment = async function (
  assignmentId,
  userId,
  role = null,
) {
  const searchQuery = { _id: assignmentId };
  if (role === null) {
    // Check whether this user has any role on this assignment.
    searchQuery.$or = [
      { lecturers: { $in: [new Types.ObjectId(userId)] } },
      { students: { $in: [new Types.ObjectId(userId)] } },
      { supervisors: { $in: [new Types.ObjectId(userId)] } }
    ];
  } else {
    // Check whether this usre has the specified role on this assignment.
    searchQuery[role + "s"] = { $in: [new Types.ObjectId(userId)] };
  }
  return this.exists(searchQuery);
};

assignmentSchema.statics.addStudents = async function (
  assignmentId,
  studentIds,
) {
  const studentObjIds = studentIds.map((s) => new Types.ObjectId(s));
  return this.updateOne(
    { _id: new Types.ObjectId(assignmentId) },
    { $addToSet: { students: { $each: studentObjIds } } },
  );
};

assignmentSchema.statics.removeStudent = async function (
  assignmentId,
  studentId,
) {
  const studentIdObj = new Types.ObjectId(studentId);
  return this.updateOne(
    { _id: new Types.ObjectId(assignmentId) },
    { $pull: { students: studentIdObj } },
  );
};

assignmentSchema.statics.getStudents = async function (assignmentId, fields="displayName email noPair") {
  return this.findById(assignmentId)
    .select("students")
    .populate({
      path: "students",
      select: fields,
      options: { sort: { displayName: 1 } },
    });
};

assignmentSchema.statics.getRequiredSkills = async function (assignmentId) {
  return this.findById(assignmentId).select("skills");
};

assignmentSchema.statics.allExistingSkills = async function () {
  // unwind splits into a document per skill per user
  // group will group by skill name
  // project removes the _id field
  return this.aggregate([
    { $unwind: "$skills" },
    {
      $group: {
        _id: "$skills.name",
        description: { $first: "$skills.description" },
      },
    },
    {
      $project: {
        name: "$_id",
        description: 1,
        _id: 0,
      },
    },
  ]);
};

module.exports = model("assignment", assignmentSchema);
