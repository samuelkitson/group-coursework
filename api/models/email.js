const { Schema, Types, model } = require("mongoose");

const emailSchema = new Schema(
  {
    sender: { type: String, required: true },
    recipients: [{ type: String, required: true }],
    assignment: { type: "ObjectId", ref: "assignment", },
    team: { type: "ObjectId", ref: "team", },
    templateId: { type: String, required: true, },
  },
  { timestamps: true },
);

emailSchema.index({ templateId: 1, assignment: 1, team: 1, });

module.exports = model("email", emailSchema);
