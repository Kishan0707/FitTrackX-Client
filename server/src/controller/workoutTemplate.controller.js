const WorkoutTemplate = require("../models/workoutTemplate.model");

const sanitizeExercises = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  return exercises
    .map((exercise) => ({
      name: exercise.name?.trim() || "",
      sets: Number(exercise.sets) || 0,
      reps: Number(exercise.reps) || 0,
      weight: exercise.weight ? Number(exercise.weight) : undefined,
      duration: exercise.duration ? Number(exercise.duration) : undefined,
    }))
    .filter((exercise) => exercise.name && exercise.sets && exercise.reps);
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, type, duration, caloriesBurned, exercises } =
      req.body;

    if (!name?.trim() || !type?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name and type are required",
      });
    }

    const template = await WorkoutTemplate.create({
      coachId: req.user._id,
      name: name.trim(),
      description: description?.trim() || "",
      type: type.trim(),
      duration: Number(duration) || 0,
      caloriesBurned: Number(caloriesBurned) || 0,
      exercises: sanitizeExercises(exercises),
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("Template creation failed:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await WorkoutTemplate.find({ coachId: req.user._id }).sort(
      { createdAt: -1 },
    );

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (err) {
    console.error("Failed to list templates:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await WorkoutTemplate.findOneAndDelete({
      _id: req.params.id,
      coachId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Template removed",
    });
  } catch (err) {
    console.error("Failed to delete template:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
