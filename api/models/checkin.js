const { Schema, model } = require("mongoose");
const assignment = require("./assignment");
const peerReview = require("./peerReview");

const fullReviewSchema = new Schema(
  {
    skills: { type: Object, of: Number, required: true, },
    comment: { type: String, required: true, },
    originalComment: { type: String, required: false, },
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

module.exports = model("checkin", checkinSchema);
