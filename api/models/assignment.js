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
    lecturers: [{ type: "ObjectId", ref: "user" }],
    students: [{ type: "ObjectId", ref: "user" }],
    skills: [skillSchema],
    allocationCriteria: [criterionSchema],
    allocationDealbreakers: [dealbreakerSchema],
    groupSize: Number,
    surplusLargerGroups: { type: Boolean, default: false },
  },
  { timestamps: true },
);

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

assignmentSchema.statics.isUserOnAssignment = async function (
  assignmentId,
  userId,
  role = "student",
) {
  const searchQuery = { _id: assignmentId };
  searchQuery[role + "s"] = { $in: [new Types.ObjectId(userId)] };
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

assignmentSchema.index({ _id: 1, students: 1 });
assignmentSchema.index({ _id: 1, lecturers: 1 });

module.exports = model("assignment", assignmentSchema);
