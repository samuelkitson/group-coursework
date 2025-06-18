const { Schema, model } = require("mongoose");

const actionPointSchema = new Schema(
  {
    action: { type: String, required: true, },
    complete: { type: Boolean, required: true, default: false, },
    assignees: [{ type: "ObjectId", ref: "user", }],
  },
  { _id: false },
);

const meetingSchema = new Schema(
  {
    team: { type: "ObjectId", ref: "team", required: true, },
    location: { type: String, required: true, },
    dateTime: { type: Date, required: true, },
    minuteTaker: { type: "ObjectId", ref: "user", required: true, },
    attendance: {
      attended: [{ type: "ObjectId", ref: "user", required: true, }],
      apologies: [{ type: "ObjectId", ref: "user", required: true, }],
      absent: [{ type: "ObjectId", ref: "user", required: true, }],
    },
    discussion: { type: String, required: true, },
    previousActions: [actionPointSchema],
    newActions: [actionPointSchema],
  },
  { timestamps: true },
);

module.exports = model("meeting", meetingSchema);
