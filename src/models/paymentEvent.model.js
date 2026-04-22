const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["webhook", "confirm-endpoint"],
      required: true,
    },
    status: {
      type: String,
      enum: ["received", "processed", "failed", "ignored"],
      default: "received",
    },
    sessionId: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentEvent", paymentEventSchema);
