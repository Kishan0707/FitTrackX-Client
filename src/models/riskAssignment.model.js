const mongoose = require("mongoose");

const riskAssignmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
riskAssignmentSchema.index({ patientId: 1, doctorId: 1 });
riskAssignmentSchema.index({ doctorId: 1, riskLevel: 1 });

module.exports = mongoose.model("RiskAssignment", riskAssignmentSchema);