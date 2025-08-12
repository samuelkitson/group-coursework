const { Schema, Types, model } = require("mongoose");

const observationSchema = new Schema(
  {
    team: { type: "ObjectId", ref: "team", required: true, },
    observer: { type: "ObjectId", ref: "user", required: true, },
    comment: { type: String, required: true, },
    students: [{ type: "ObjectId", ref: "user", required: false, }],
  },
  { timestamps: true },
);

observationSchema.index({ team: 1 });

module.exports = model("observation", observationSchema);
