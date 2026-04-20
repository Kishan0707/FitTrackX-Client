const mongoose = require("mongoose");

const aiExerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 10 },
    video: { type: String },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: true },
);

const aiDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    workout: { type: String, required: true },
    image: { type: String },
    exercises: { type: [aiExerciseSchema], default: [] },
  },
  { _id: true },
);

const aiWorkoutPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goal: { type: String, required: true },
    experience: { type: String, required: true },
    days: { type: [aiDaySchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AiWorkoutPlan", aiWorkoutPlanSchema);

