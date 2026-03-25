const Workout = require("../models/workout.model");
const User = require("../models/user.model");

exports.createWorkout = async (req, res) => {
  try {
    const { type, exercises, caloriesBurned, duration } = req.body;

    const workout = await Workout.create({
      userId: req.user._id,
      type,
      exercises,
      caloriesBurned,
      duration,
    });

    const user = await User.findById(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.lastWorkoutDate) {
      user.workoutStreak = 1;
      user.lastWorkoutDate = today;
    } else {
      const lastDate = new Date(user.lastWorkoutDate);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.workoutStreak += 1;
        user.lastWorkoutDate = today;
      } else if (diffDays > 1) {
        user.workoutStreak = 1;
        user.lastWorkoutDate = today;
      }
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: "workout Added Successfully",
      data: workout,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllWorkouts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const workouts = await Workout.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateWorkouts = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    if (workout.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const updated = await Workout.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    if (workout.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    await workout.deleteOne();

    res.status(200).json({
      success: true,
      message: "Workout deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.dailySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const workouts = await Workout.find({
      userId: req.user._id,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalCalories = workouts.reduce(
      (sum, w) => sum + w.caloriesBurned,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalWorkouts: workouts.length,
        totalCalories,
        workouts,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.weeklySummary = async (req, res) => {
  try {
    const today = new Date();

    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const workouts = await Workout.find({
      userId: req.user._id,
      createdAt: { $gte: startOfWeek },
    });

    const totalCalories = workouts.reduce(
      (sum, w) => sum + w.caloriesBurned,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalWorkouts: workouts.length,
        totalCalories,
        workouts,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.monthlySummary = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const workouts = await Workout.find({
      userId: req.user._id,
      createdAt: { $gte: startOfMonth },
    });

    const totalCalories = workouts.reduce(
      (sum, w) => sum + w.caloriesBurned,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalWorkouts: workouts.length,
        totalCalories,
        workouts,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.workoutAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const workouts = await Workout.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          calories: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    const totalWorkouts = workouts.length;

    const totalCaloriesBurned = workouts.reduce(
      (sum, w) => sum + w.caloriesBurned,
      0,
    );

    const workoutsByType = {};

    workouts.forEach((workout) => {
      const type = workout.type;

      if (!workoutsByType[type]) {
        workoutsByType[type] = {
          count: 0,
          calories: 0,
        };
      }

      workoutsByType[type].count += 1;
      workoutsByType[type].calories += workout.caloriesBurned;
    });

    const avgCalories =
      totalWorkouts > 0 ? Math.round(totalCaloriesBurned / totalWorkouts) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalWorkouts,
        totalCaloriesBurned,
        avgCalories,
        workoutsByType,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.generateWeeklyWorkout = async (req, res) => {
  try {
    const { goal, daysPerWeek, experience } = req.body;

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const splits = [
      "Chest + Triceps",
      "Back + Biceps",
      "Legs",
      "Shoulders",
      "Arms",
      "Core",
    ];

    const plan = days.slice(0, daysPerWeek).map((day, index) => ({
      day,
      workout: splits[index % splits.length],
    }));

    res.status(200).json({
      success: true,
      goal,
      experience,
      plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.generateWorkoutPlan = async (req, res) => {
  try {
    const { goal, level, duration } = req.body;

    const workoutPlan = {
      goal,
      level,
      duration,
      exercises: [
        { name: "Push Ups", sets: 3, reps: 12, rest: "60s" },
        { name: "Squats", sets: 3, reps: 15, rest: "60s" },
        { name: "Plank", sets: 3, time: "30s", rest: "60s" },
      ],
    };

    res.status(200).json({
      success: true,
      data: workoutPlan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getUserWorkouts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const workouts = await Workout.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
