const { Schema, model } = require("mongoose");

const checkinSchema = new Schema(
  {
    team: { type: "ObjectId", ref: "team", required: true, },
    periodStart: { type: Date, required: true, },
    periodEnd: { type: Date, required: true, },
    effortPoints: {
      type: Object,
      of: {
        type: Object, 
        of: Number,
      },
      required: true,
    },
  },
);

checkinSchema.statics.findActiveForTeam = async function (
  teamId,
  searchDate = new Date(),
  selectFields,
) {
  return this.findOne(
    {
      team: teamId,
      periodStart: { $lte: searchDate, },
      periodEnd: { $gte: searchDate, },
    },
  ).select(selectFields);
};

checkinSchema.statics.findActiveForTeams = async function (
  teamIds = [],
  searchDate = new Date(),
  selectFields,
) {
  return this.find(
    {
      team: { $in : teamIds, },
      periodStart: { $lte: searchDate, },
      periodEnd: { $gte: searchDate, },
    }, 
  ).select(selectFields);
};

checkinSchema.statics.createNewCheckin = async function (
  teamId,
  date=undefined,
) {
  const checkinDate = date ?? new Date();
  let periodStart = new Date(checkinDate);
  if (checkinDate.getDay() !== 1) {
    // Not Monday today, so set start period back to previous Monday
    // https://stackoverflow.com/a/46544455
    periodStart.setDate(periodStart.getDate() - (periodStart.getDay() + 6) % 7);
  }
  periodStart.setHours(0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 6);
  periodEnd.setHours(23, 59, 59); 

  return await this.create({
    team: teamId,
    periodStart,
    periodEnd,
    effortPoints: new Map(),
  });
};

module.exports = model("checkin", checkinSchema);
