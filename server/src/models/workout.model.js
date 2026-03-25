const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "cardio",
        "strength",
        "flexibility",
        "balance",
        "gym",
        "home",
        "run",
        "boxing",
      ],
      required: true,
      index: true,
    },
    exercises: [
      {
        name: {
          type: String,
          required: true,
        },
        sets: {
          type: Number,
          required: true,
        },
        reps: {
          type: Number,
          required: true,
        },
        weight: {
          type: Number,
        },
        duration: {
          type: Number,
        },
      },
    ],
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Workout", workoutSchema);
