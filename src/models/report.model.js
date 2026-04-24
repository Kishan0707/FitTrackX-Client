const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fileUrl: String,
  type: String,
  status: {
    type: String,
    enum: ["pending", "reviewed", "archived"],
    default: "pending",
  },
  notes: {
    type: String,
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Report", reportSchema);
