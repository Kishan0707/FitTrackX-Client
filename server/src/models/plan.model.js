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
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    description: {
      // plan ke baare mein details
      type: String,
      required: true,
    },
    duration: {
      // plan ki duration in weeks
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    subscriptionPlan: {
      type: [String],
      required: true,
      ref: "Plan",
    },
    // features: {
    // plan ke features jaise ki access to workouts, diet plans, etc.
    // type: [String],
    // required: true,
    // },
    workouts: [
      {
        type: [String],
        required: true,
      },
    ],
    dietPlan: {
      // plan ke diet details
      // jaise ki breakfast, lunch, dinner, etc.
      type: [String],
      // required: true,
    },
  },
  {
    timestamps: true,
  },
);

exports.Plan = mongoose.model("Plan", exports.planSchema);
