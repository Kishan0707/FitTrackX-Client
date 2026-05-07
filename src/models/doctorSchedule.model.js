const mongoose = require("mongoose");

const doctorScheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  breakStart: {
    type: String,
    default: null,
  },
  breakEnd: {
    type: String,
    default: null,
  },
  maxAppointments: {
    type: Number,
    default: 10,
  },
  notes: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active",
  },
  bookedAppointments: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
doctorScheduleSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
