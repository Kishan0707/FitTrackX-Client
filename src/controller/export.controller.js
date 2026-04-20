const User = require("../models/user.model");
const { Workout } = require("../models/workout.model");
const Diet = require("../models/diet.model");
const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const BodyMeasurement = require("../models/bodyMeasurement.model");
const ProgressPhoto = require("../models/progressPhoto.model");

exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all user data
    const user = await User.findById(userId).select("-password");
    const workouts = await Workout.find({ userId });
    const diets = await Diet.find({ userId });
    const subscriptions = await Subscription.find({ userId });
    const measurements = await BodyMeasurement.find({ userId });
    const photos = await ProgressPhoto.find({ userId });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        age: user.age,
        weight: user.weight,
        height: user.height,
        goal: user.goal,
        role: user.role,
        createdAt: user.createdAt,
      },
      workouts: workouts.map(w => ({
        exerciseType: w.exerciseType,
        duration: w.duration,
        caloriesBurned: w.caloriesBurned,
        sets: w.sets,
        reps: w.reps,
        notes: w.notes,
        date: w.date,
      })),
      diets: diets.map(d => ({
        meals: d.meals,
        totalCalories: d.totalCalories,
        totalProtein: d.totalProtein,
        totalCarbs: d.totalCarbs,
        totalFat: d.totalFat,
        date: d.createdAt,
      })),
      subscriptions: subscriptions.map(s => ({
        planId: s.planId,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        amount: s.amount,
      })),
      measurements: measurements.map(m => ({
        weight: m.weight,
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        arms: m.arms,
        thighs: m.thighs,
        date: m.date,
      })),
      photos: photos.map(p => ({
        imageUrl: p.imageUrl,
        notes: p.notes,
        date: p.date,
      })),
    };

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=fittrack-data-${userId}-${Date.now()}.json`
    );

    res.status(200).json(exportData);
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data",
      error: error.message,
    });
  }
};

exports.exportUserDataCSV = async (req, res) => {
  try {
    const userId = req.user._id;
    const workouts = await Workout.find({ userId });

    // Create CSV content
    let csv = "Date,Exercise Type,Duration (min),Calories Burned,Sets,Reps,Notes\n";
    
    workouts.forEach(w => {
      csv += `${new Date(w.date).toLocaleDateString()},${w.exerciseType || ""},${w.duration || 0},${w.caloriesBurned || 0},${w.sets || 0},${w.reps || 0},"${w.notes || ""}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=fittrack-workouts-${userId}-${Date.now()}.csv`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export CSV",
      error: error.message,
    });
  }
};

module.exports = exports;
