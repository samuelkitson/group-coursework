const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: false },
    bio: String,
    role: {
      type: String,
      enum: ["student", "staff", "admin"],
      default: "student",
    },
    skills: {
      type: Map,
      of: Number,
    },
    meetingPref: {
      type: String,
      enum: ["online", "in-person", "either"],
    },
    international: { type: Boolean, default: false },
    marks: {
      type: Map,
      of: Number,
    },
    gender: { type: String, },
    noPair: [{ type: "ObjectId", ref: "user", }],
  },
  { timestamps: true },
);

userSchema.statics.getSkills = async function (userId) {
  return this.findById(userId).select("skills");
};

// Get a list of all the previously used skills tags so they can be re-used
userSchema.statics.allExistingSkills = async function () {
  const result = await this.aggregate([
    { $project: { skillNames: { $objectToArray: "$skills" } } },
    { $unwind: "$skillNames" },
    { $group: { _id: null, uniqueKeys: { $addToSet: "$skillNames.k" } } },
  ]);
  return result[0]?.uniqueKeys.sort() || [];
};

module.exports = model("user", userSchema);
