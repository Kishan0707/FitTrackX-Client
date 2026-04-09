const mongoose = require("mongoose");
const { trim } = require("validator");

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coachId: {
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
    title: {
      type: String,
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
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "skipped", "cancelled"],
      default: "pending",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    feedback: {
      type: String,
      trim: true,
    },
    completionNote: {
      type: String,
      trim: true,
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
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

const WorkoutHistorySchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workout",
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

const Workout = mongoose.model("Workout", workoutSchema);
const WorkoutHistory =
  mongoose.models.WorkoutHistory ||
  mongoose.model("WorkoutHistory", WorkoutHistorySchema);

module.exports = {
  Workout,
  WorkoutHistory,
  WorkoutHistorySchema,
};
