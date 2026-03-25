const BodyMeasurement = require("../models/bodyMeasurement.model");
const Workout = require("../models/workout.model");
const Diet = require("../models/diet.model");

exports.progress = async (req, res) => {
  try {
    const userId = req.user._id;

    // weight history
    const weights = await BodyMeasurement.find(
      { userId },
      { weight: 1, createdAt: 1, _id: 0 },
    ).sort({ createdAt: 1 });

    // workout calories
    const workouts = await Workout.find(
      { userId },
      { caloriesBurned: 1, createdAt: 1, _id: 0 },
    ).sort({ createdAt: 1 });

    const caloriesBurned = workouts.map((w) => ({
      date: w.createdAt,
      calories: w.caloriesBurned,
    }));

    // diet protein intake
    const diets = await Diet.find(
      { userId },
      { totalProtein: 1, createdAt: 1, _id: 0 },
    ).sort({ createdAt: 1 });

    const proteinIntake = diets.map((d) => ({
      date: d.createdAt,
      protein: d.totalProtein,
    }));

    res.status(200).json({
      success: true,
      data: {
        weightHistory: weights,
        caloriesBurned,
        proteinIntake,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.monthlyComparision = async (req, res) => {
  const userId = req.user._id;
  try {
    const now = new Date();
    const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const endPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentWorkout = await Workout.find({
      userId: userId,
      createdAt: { $gte: startCurrentMonth },
    });

    const previousWorkout = await Workout.find({
      userId: userId,
      createdAt: { $gte: startPreviousMonth, $lt: endPreviousMonth },
    });

    // calories burned
    const currentCalories = currentWorkout.reduce(
      (sum, workout) => sum + workout.caloriesBurned,
      0,
    );
    const previousCalories = previousWorkout.reduce(
      (sum, workout) => sum + workout.caloriesBurned,
      0,
    );

    const calorieChange =
      ((currentCalories - previousCalories) / previousCalories) * 100; // percentage change

    // diet protein
    const currentDiet = await Diet.find({
      userId: userId,
      createdAt: { $gte: startCurrentMonth },
    });
    const previousDiet = await Diet.find({
      userId: userId,
      createdAt: { $gte: startPreviousMonth, $lt: endPreviousMonth },
    });
    const avgProteinCurrent =
      currentDiet.reduce((sum, d) => sum + d.totalProtein, 0) /
      (currentDiet.length || 1);
    const avgProteinPrevious =
      previousDiet.reduce((sum, d) => sum + d.totalProtein, 0) /
      (previousDiet.length || 1);

    // measurement
    const measurements = await BodyMeasurement.find({ userId }).sort({
      createdAt: 1,
    });

    // weightChange
    const weightChange =
      measurements.length > 1
        ? measurements[measurements.length - 1].weight - measurements[0].weight
        : 0;
    res.status(200).json({
      success: true,
      data: {
        currentMonth: {
          workouts: currentWorkout.length,
          caloriesBurned: currentCalories,
          avgProtein: avgProteinCurrent,
          weightChange,
        },
        previousMonth: {
          workouts: previousWorkout.length,
          caloriesBurned: previousCalories,
          avgProtein: avgProteinPrevious,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
