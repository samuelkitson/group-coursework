const { Schema, Types, model } = require("mongoose");
const { GenericNotFoundError } = require("../errors/errors");

const peerReviewSchema = new Schema(
  {
    assignment: { type: Types.ObjectId, ref: "assignment", required: true, },
    periodStart: { type: Date, required: true, },
    periodEnd: { type: Date, required: true, },
    type: {
      type: String,
      enum: [ "none", "simple", "full", ],
      default: "simple",
    },
    questions: [String],
  },
  { timestamps: false },
);

peerReviewSchema.statics.findByAssignment = async function (
  assignmentId,
  searchDate = new Date(),
  selectFields,
) {
  return this.findOne(
    {
      assignment: assignmentId,
      periodStart: { $lte: searchDate, },
      periodEnd: { $gte: searchDate, },
    },
  ).select(selectFields);
};

module.exports = model("peerReview", peerReviewSchema);
