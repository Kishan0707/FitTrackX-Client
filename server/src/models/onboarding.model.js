const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    promoRevealed: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
      default: null,
    },
    photoName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("OnboardingSubmission", onboardingSchema);
