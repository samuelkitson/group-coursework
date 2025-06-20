const { Schema, model, Types } = require("mongoose");

const teamSchema = new Schema(
  {
    assignment: { type: "ObjectId", ref: "assignment", required: true,  },
    teamNumber: { type: Number, required: true, },
    members: [{ type: "ObjectId", ref: "user", required: true, }],
    supervisors: [{ type: "ObjectId", ref: "user", required: false, }],
  },
  { timestamps: false },
);

teamSchema.statics.isUserOnTeam = async function (
  teamId,
  userId,
) {
  const searchQuery = { _id: teamId, members: { $in: [new Types.ObjectId(userId)] } };
  return this.exists(searchQuery);
};

teamSchema.statics.isSupervisorOnTeam = async function (
  teamId,
  userId,
) {
  const searchQuery = { _id: teamId, supervisors: { $in: [new Types.ObjectId(userId)] } };
  return this.exists(searchQuery);
};

module.exports = model("team", teamSchema);
