const { Schema, model } = require("mongoose");

const actionPointSchema = new Schema(
  {
    action: { type: String, required: true, },
    complete: { type: Boolean, required: true, default: false, },
    assignees: [{ type: "ObjectId", ref: "user", }],
  },
  { _id: false },
);

const disputeSchema = new Schema(
  {
    complainant: { type: "ObjectId", ref: "user", required: true, },
    notes: { type: String, required: true, },
    status: {
      type: String,
      enum: ["outstanding", "resolved", "escalate", "ignore"],
      default: "outstanding",
    },
  },
  { _id: true },
);

const editLogSchema = new Schema(
  {
    editor: { type: "ObjectId", ref: "user", required: true, },
    dateTime: { type: Date, required: true, },
    description: { type: String, required: false, },
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
    disputes: [disputeSchema],
    editLog: [editLogSchema],
  },
  { timestamps: true },
);

module.exports = model("meeting", meetingSchema);
