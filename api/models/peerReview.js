const { Schema, Types, model } = require("mongoose");
const { GenericNotFoundError } = require("../errors/errors");

/**
 * periodStart and periodEnd use the timezone of the server. The time for
 * periodStart is always 00:00:00.000 and the time for periodEnd is always
 * 23:59:59.999.
 */

const peerReviewSchema = new Schema(
  {
    assignment: { type: Types.ObjectId, ref: "assignment", required: true, },
    name: { type: String, required: false, },
    periodStart: { type: Date, required: true, },
    periodEnd: { type: Date, required: true, },
    type: {
      type: String,
      enum: [ "none", "simple", "full", ],
      default: "simple",
    },
    questions: [String],
    reminderSent: { type: Boolean, required: false, },
  },
  { timestamps: false },
);

peerReviewSchema.index({ assignment: 1, periodEnd: 1, periodStart: 1 });

peerReviewSchema.statics.findByAssignment = async function (
  assignmentId,
  searchDate = new Date(),
  selectFields,
) {
  return this.findOne(
    {
      assignment: assignmentId,
      periodEnd: { $gte: searchDate, },
      periodStart: { $lte: searchDate, },
    },
  ).select(selectFields);
};

module.exports = model("peerReview", peerReviewSchema);
