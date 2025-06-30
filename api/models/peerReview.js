const { Schema, Types, model } = require("mongoose");

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

module.exports = model("peerReview", peerReviewSchema);
