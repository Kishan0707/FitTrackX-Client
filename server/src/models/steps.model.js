const mongoose = require("mongoose");

const stepsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    steps: { type: Number, default: 0 },
    goal: { type: Number, default: 10000 },
    goalStatus: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Steps", stepsSchema);
