const { Workout } = require("../models/workout.model");
const User = require("../models/user.model");

exports.createWorkout = async (req, res) => {
  try {
    const { type, title, exercises, caloriesBurned, duration, userId } =
      req.body;

    // Validate required fields
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required",
      });
    }

    const workoutData = {
      userId: userId || req.user._id, // Use provided userId or current user
      type,
      title: title || type.charAt(0).toUpperCase() + type.slice(1) + " Workout", // Auto-generate title if not provided
      exercises: exercises || [],
      caloriesBurned: caloriesBurned || 0,
      duration: duration || 0,
      coachId: req.user._id, // Current user is the coach/creator
    };

    console.log("Creating workout with data:", workoutData);

    console.log("Attempting to save to database...");
    const workout = await Workout.create(workoutData);
    console.log("✓ Workout saved successfully!");
    console.log("Saved workout ID:", workout._id);
    console.log("Saved workout details:", {
      _id: workout._id,
      userId: workout.userId,
      coachId: workout.coachId,
    });

    const user = await User.findById(workoutData.userId);
    if (user) {
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
    }

    res.status(201).json({
      success: true,
      message: "workout Added Successfully",
      data: workout,
    });
  } catch (err) {
    console.error("Error creating workout:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getAllWorkouts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log(
      "Fetching workouts for user:",
      req.user._id,
      "Role:",
      req.user.role,
    );

    // If user is a coach, show workouts they created (where coachId = their ID)
    // If user is a regular user, show workouts assigned to them or created for them
    let query = {};
    if (req.user.role === "coach" || req.user.role === "admin") {
      query = { coachId: req.user._id };
      console.log("Coach/Admin query:", query);
    } else {
      // Regular user sees workouts assigned to them
      query = { userId: req.user._id };
      console.log("User query:", query);
    }

    if (
      (req.user.role === "coach" || req.user.role === "admin") &&
      req.query.userId
    ) {
      query.userId = req.query.userId;
    }

    const workouts = await Workout.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalCount = await Workout.countDocuments(query);
    console.log(
      "Workouts found:",
      workouts.length,
      "Total in DB with query:",
      totalCount,
    );
    console.log(
      "Sample workout:",
      workouts[0] ?
        {
          _id: workouts[0]._id,
          userId: workouts[0].userId,
          coachId: workouts[0].coachId,
        }
      : "none",
    );

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (err) {
    console.error("Error fetching workouts:", err);
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

    // Allow update if user is the one the workout is assigned to OR the coach/admin who created it
    if (
      workout.userId.toString() !== req.user._id.toString() &&
      workout.coachId.toString() !== req.user._id.toString()
    ) {
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
    console.log("Attempting to delete workout with ID:", req.params.id);
    console.log("User ID:", req.user._id);

    const workout = await Workout.findById(req.params.id);
    console.log(
      "Workout found:",
      workout ?
        { _id: workout._id, userId: workout.userId, coachId: workout.coachId }
      : "NOT FOUND",
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    // Allow deletion if user is the one the workout is assigned to OR the coach/admin who created it
    const userIdMatch = workout.userId?.toString() === req.user._id.toString();
    const coachIdMatch =
      workout.coachId?.toString() === req.user._id.toString();

    console.log("userIdMatch:", userIdMatch, "coachIdMatch:", coachIdMatch);

    if (!userIdMatch && !coachIdMatch) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    await workout.deleteOne();
    console.log("Workout deleted successfully");

    res.status(200).json({
      success: true,
      message: "Workout deleted",
    });
  } catch (err) {
    console.error("Error deleting workout:", err);
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

exports.getProgressSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const [totalAssigned, completedCount, pendingCount, inProgressCount] =
      await Promise.all([
        Workout.countDocuments({ userId, isDeleted: false }),
        Workout.countDocuments({
          userId,
          status: "completed",
          isDeleted: false,
        }),
        Workout.countDocuments({
          userId,
          status: "pending",
          isDeleted: false,
        }),
        Workout.countDocuments({
          userId,
          status: "in_progress",
          isDeleted: false,
        }),
      ]);

    const completionRate =
      totalAssigned === 0 ? 0 : (
        Math.round((completedCount / totalAssigned) * 100)
      );

    const weeklyTrendDocs = await Workout.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendMap = weeklyTrendDocs.reduce((acc, item) => {
      acc[item._id] = item;
      return acc;
    }, {});

    const weeklyTrend = [];
    for (let i = 0; i < 7; i += 1) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const iso = dayDate.toISOString().split("T")[0];
      weeklyTrend.push({
        day: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        total: trendMap[iso]?.total || 0,
        completed: trendMap[iso]?.completed || 0,
      });
    }

    const nextWorkout = await Workout.findOne({
      userId,
      isDeleted: false,
      scheduledFor: { $gte: now },
    })
      .sort({ scheduledFor: 1 })
      .populate("coachId", "name")
      .select("title scheduledFor status coachId");

    const lastCompleted = await Workout.findOne({
      userId,
      status: "completed",
      isDeleted: false,
    })
      .sort({ completedAt: -1 })
      .select("title completedAt");

    res.status(200).json({
      success: true,
      data: {
        totalAssigned,
        completedCount,
        pendingCount,
        inProgressCount,
        completionRate,
        nextWorkout,
        lastCompleted,
        weeklyTrend,
      },
    });
  } catch (err) {
    console.error("Progress summary error:", err);
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
    const workout = await Workout.create({
      userId: req.user._id,
      coachId: req.user._id, // AI = self coach
      type: "home",
      title: `${goal} AI Workout`,
      exercises: workoutPlan.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
      })),
      status: "pending",
    });

    res.status(200).json({
      success: true,
      data: workout,
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

exports.completeExercise = async (req, res) => {
  try {
    const { workoutId, exerciseId } = req.body;

    if (!workoutId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: "Missing workoutId or exerciseId",
      });
    }

    const workout = await Workout.findById(workoutId);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }

    const exercise = workout.exercises.id(exerciseId);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found",
      });
    }

    exercise.isCompleted = true;
    exercise.completedAt = new Date();

    await workout.save();

    res.json({
      success: true,
      message: "Exercise completed",
      data: workout,
    });
  } catch (err) {
    console.error("Complete exercise error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
