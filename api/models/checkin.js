const { Schema, model } = require("mongoose");
const assignment = require("./assignment");
const peerReview = require("./peerReview");

// New object format

const fullReviewSchema = new Schema(
  {
    skills: { type: Object, of: Number, required: true, },
    comment: { type: String, required: true, },
  },
  { _id: false, },
);

const checkinSchema = new Schema(
  {
    reviewer: { type: "ObjectId", ref: "user", required: true, },
    team: { type: "ObjectId", ref: "team", required: true, },
    peerReview:  { type: "ObjectId", ref: "peerReview", required: true, },
    effortPoints: { type: Object, of: Number, },
    reviews: { type: Object, of: fullReviewSchema, },
  },
  { _id: true, timestamps: true, },
);




const oldCheckinSchema = new Schema(
  {
    team: { type: "ObjectId", ref: "team", required: true, },
    peerReview:  { type: "ObjectId", ref: "peerReview", required: true, },
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

checkinSchema.statics.findByTeamAndPeerReview = async function (
  teamId,
  peerReviewId,
  selectFields,
) {
  return this.find(
    {
      team: teamId,
      peerReview: peerReviewId,
    },
  ).select(selectFields);
}

checkinSchema.statics.findByTeamsAndPeerReview = async function (
  teamIds = [],
  peerReviewId,
  selectFields,
) {
  return this.find(
    {
      team: { $in : teamIds, },
      peerReview: peerReviewId,
    }, 
  ).select(selectFields);
};

checkinSchema.statics.createNewCheckin = async function (
  teamId,
  peerReviewId,
) {
  const checkinDate = new Date();
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
    peerReview: peerReviewId,
    periodStart,
    periodEnd,
    effortPoints: new Map(),
  });
};

module.exports = model("checkin", checkinSchema);
