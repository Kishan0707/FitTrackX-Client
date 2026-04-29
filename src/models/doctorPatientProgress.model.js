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
    forearms: Number,
    biceps: Number,
  },
  photos: [String],
  notes: String,
  doctorNotes: String,
  symptoms: String,
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    bloodSugar: Number,
  },
  dietAdherence: {
    type: Number,
    min: 0,
    max: 10,
  },
  exerciseAdherence: {
    type: Number,
    min: 0,
    max: 10,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
  },
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
  type: {
    type: String,
    enum: ["milestone", "goal_reached", "streak", "custom"],
    default: "custom",
  },
});

const doctorPatientProgressSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    programType: {
      type: String,
      enum: [
        "weight_loss",
        "muscle_gain",
        "maintenance",
        "medical_condition",
        "general_health",
      ],
      default: "general_health",
    },
    medicalCondition: {
      type: String,
      description: String,
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
      weeklyTarget: Number,
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
        forearms: Number,
        biceps: Number,
      },
      date: { type: Date, default: Date.now },
    },
    currentStats: {
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
    doctorNotes: [
      {
        date: { type: Date, default: Date.now },
        note: String,
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },
    lastReviewed: {
      date: Date,
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    nextFollowUp: Date,
    alerts: [
      {
        type: {
          type: String,
          enum: ["warning", "critical", "info", "reminder"],
        },
        message: String,
        date: Date,
        acknowledged: { type: Boolean, default: false },
        acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true },
);

// Index for faster queries
doctorPatientProgressSchema.index({ patientId: 1, doctorId: 1 });
doctorPatientProgressSchema.index({ doctorId: 1, status: 1 });
doctorPatientProgressSchema.index({ patientId: 1, "progressData.date": -1 });

// Calculate progress percentage based on weight
doctorPatientProgressSchema.methods.calculateWeightProgress = function () {
  const targetWeight = Number(this.goals?.targetWeight);
  const startWeight = Number(this.initialStats?.weight);

  if (!Number.isFinite(targetWeight) || !Number.isFinite(startWeight)) {
    return null;
  }

  const currentWeight = Number(this.currentStats?.weight);
  if (!Number.isFinite(currentWeight)) {
    return null;
  }

  // Determine if weight loss or gain
  const weightChangeNeeded = startWeight - targetWeight;
  const currentChange = startWeight - currentWeight;

  if (weightChangeNeeded === 0) {
    return currentWeight === targetWeight ? 100 : 0;
  }

  let progress = (currentChange / weightChangeNeeded) * 100;

  // For weight gain scenarios
  if (weightChangeNeeded < 0) {
    progress =
      ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100;
  }

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 100);
};

// Calculate BMI progress
doctorPatientProgressSchema.methods.calculateBMI = function () {
  const heightInMeters = (this.initialStats?.height || 0) / 100;
  const currentWeight = this.currentStats?.weight;

  if (!heightInMeters || !currentWeight) return null;

  return (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
};

// Get weekly progress delta
doctorPatientProgressSchema.methods.getWeeklyDelta = function () {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const previousEntry = this.progressData.find(
    (entry) => entry.date <= oneWeekAgo,
  );

  if (!previousEntry || !this.currentStats?.weight) {
    return null;
  }

  return this.currentStats.weight - previousEntry.weight;
};

// Update status based on progress and deadlines
doctorPatientProgressSchema.methods.updateStatus = function () {
  if (this.status === "paused" || this.status === "cancelled") {
    return this.status;
  }

  const progress = this.calculateWeightProgress();
  if (progress !== null && progress >= 100) {
    this.status = "completed";
  } else if (this.goals?.deadline && new Date() > this.goals.deadline) {
    // Optionally mark as completed or past due - keeping active for now
    // this.status = "completed";
  }

  return this.status;
};

// Pre-save hook to update status
doctorPatientProgressSchema.pre("save", function () {
  this.updateStatus();
});

module.exports = mongoose.model(
  "DoctorPatientProgress",
  doctorPatientProgressSchema,
);
