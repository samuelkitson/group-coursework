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

teamSchema.index({ assignment: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ supervisors: 1 });

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

teamSchema.statics.getNumberOfSupervisees = async function (
  supervisorIds,
) {
  const supervisorTeamCounts = supervisorIds.reduce((acc, cur) => { return {...acc, [cur]: 0}}, {});
  const teams = await this.find({ supervisors: { $in: supervisorIds } }).lean();
  teams.forEach(team => {
    team.supervisors.forEach(supervisorId => {
      const supervisorIdStr = supervisorId.toString();
      if (supervisorTeamCounts.hasOwnProperty(supervisorIdStr)) {
        supervisorTeamCounts[supervisorIdStr]++;
      }
    });
  });
  return supervisorTeamCounts;
};

module.exports = model("team", teamSchema);
