const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: Date,
  status: { type: String, default: "pending" },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "cancelled"],
    default: "pending",
  },

  // 🔥 IMPORTANT
  roomId: String,
  callStarted: { type: Boolean, default: false },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
