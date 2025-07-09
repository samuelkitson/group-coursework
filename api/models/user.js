const { Schema, model } = require("mongoose");

/**
 * NOTES ON HOW USER ACCOUNTS WORK
 * User accounts are stored within the app, identified by their MongoDB ObjectID
 * but in places also by their email address. Most accounts won't have a
 * passwordHash field set, meaning that they can only be logged into via Entra.
 * 
 * When a user logs in with their University account via Entra, the email
 * address in the response is looked up in MongoDB to find their account. If an
 * account is found with that email, a session is created for that user. If no
 * account is found, a new one will be created using their email, display name
 * and student/staff status.
 * 
 * In some cases, user accounts need to be created before they have logged in,
 * for example when adding a new staff member to a module team. In this case,
 * their role will be set to "placeholder" and will be updated when they first
 * log in via Entra.
 */

const userSchema = new Schema(
  {
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: false },
    bio: String,
    role: {
      type: String,
      enum: ["student", "staff", "admin", "placeholder"],
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

userSchema.statics.createPlaceholder = async function (emailAddress, displayName) {
  const userDisplayName = displayName ?? emailAddress;
  return this.create({
    email: emailAddress,
    displayName: userDisplayName,
    role: "placeholder",
  });
};

module.exports = model("user", userSchema);
