const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isEmergency: { type: Boolean, default: false },
  medicines: [
    {
      name: String,
      dosage: String,
      frequency: String,
    },
  ],
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
