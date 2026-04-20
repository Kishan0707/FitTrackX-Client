const mongoose = require("mongoose");

exports.planSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // index for faster queries based on coachId
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    description: {
      // plan ke baare mein details
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      // frontend currently sends duration in days
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subscriptionPlan: {
      type: [String],
      default: [],
      ref: "Plan",
    },
    features: {
      // plan ke features jaise ki access to workouts, diet plans, etc.
      type: [String],
      default: [],
    },
    workouts: [
      {
        type: [String],
      },
    ],
    dietPlan: {
      // plan ke diet details
      // jaise ki breakfast, lunch, dinner, etc.
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

exports.Plan = mongoose.model("Plan", exports.planSchema);
