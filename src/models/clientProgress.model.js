const mongoose = require("mongoose");

const progressEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  weight: {
    type: Number,
  },
  bodyFat: {
    type: Number,
  },
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number,
  },
  photos: [String],
  notes: String,
});

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  icon: String,
});

const clientProgressSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    goals: {
      targetWeight: Number,
      targetBodyFat: Number,
      targetMeasurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        thighs: Number,
      },
      deadline: Date,
      description: String,
    },
    initialStats: {
      weight: Number,
      bodyFat: Number,
      measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        thighs: Number,
      },
    },
    progressData: [progressEntrySchema],
    achievements: [achievementSchema],
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Calculate progress percentage
clientProgressSchema.methods.calculateProgress = function () {
  const targetWeight = Number(this.goals?.targetWeight); //
  const startWeight = Number(this.initialStats?.weight);

  if (!Number.isFinite(targetWeight) || !Number.isFinite(startWeight)) {
    return 0;
  }

  const latestProgress = this.progressData[this.progressData.length - 1];
  const currentWeight = Number(latestProgress?.weight);
  if (!Number.isFinite(currentWeight)) {
    return 0;
  }

  const totalChangeNeeded = startWeight - targetWeight;
  if (totalChangeNeeded === 0) {
    return currentWeight === targetWeight ? 100 : 0;
  }

  const progress = ((startWeight - currentWeight) / totalChangeNeeded) * 100;

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
};

// Keep status consistent with latest calculated progress
clientProgressSchema.methods.syncStatusWithProgress = function () {
  if (this.status === "paused") {
    return this.status;
  }

  const progressPercentage = this.calculateProgress();
  this.status = progressPercentage >= 100 ? "completed" : "active";
  return this.status;
};

clientProgressSchema.pre("save", async function () {
  this.syncStatusWithProgress();
});

// Index for faster queries
clientProgressSchema.index({ clientId: 1, coachId: 1 });
clientProgressSchema.index({ coachId: 1, status: 1 });

module.exports = mongoose.model("ClientProgress", clientProgressSchema);
