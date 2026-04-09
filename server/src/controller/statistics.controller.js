const { Workout } = require("../models/workout.model");
const Diet = require("../models/diet.model");
const User = require("../models/user.model");
const redisClient = require("../config/redis");

exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total workouts
    const totalWorkouts = await Workout.countDocuments({ userId });
    const workouts = await Workout.find({ userId }).lean();

    // Total diet entries

    // Total calories burned
    const totalCaloriesBurned = await workouts.reduce(
      (sum, workout) => sum + (workout.caloriesBurned || 0),
      0,
    );
    const Diets = await Diet.find({ userId });
    const totalDiets = await Diets.reduce(
      (sum, diet) => sum + (diet.totalCalories || 0),
      0,
    );
    // Total users (for admin/coach, but adding here for demo)
    const totalUsers = await User.countDocuments();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthUser = await User.countDocuments({
      createdAt: { $gte: lastMonth },
    });
    const growth =
      totalUsers > 0 ? Math.round((lastMonthUser / totalUsers) * 100) : 0;
    // Total protein intake
    const totalProteinIntake = await Diet.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$totalProtein" } } },
    ]);

    // Total weight lifted
    const totalWeightLifted = await Workout.aggregate([
      { $match: { userId, type: "weightlifting" } },
      { $unwind: "$exercises" },
      { $group: { _id: null, total: { $sum: "$exercises.weight" } } },
    ]);

    // Total distance covered
    // const totalDistanceCovered = await Workout.aggregate([
    //   { $match: { userId, type: "cardio" } },
    //   { $unwind: "$exercises" },
    //   { $group: { _id: null, total: { $sum: "$exercises.distance" } } },
    // ]);
    const data = {
      workoutStrike: 0,
      totalWorkouts: totalWorkouts,
      totalDiets: totalDiets,
      totalCaloriesBurned: totalCaloriesBurned,
      totalProteinIntake:
        totalProteinIntake.length > 0 ? totalProteinIntake[0].total : 0,
      totalWeightLifted:
        totalWeightLifted.length > 0 ? totalWeightLifted[0].total : 0,
      totalUsers: totalUsers,
      userGrowth: growth,
    };
    // NOTE: caching can throw if Redis is unavailable; disable while debugging
    // await redisClient.set(req.cacheKey, JSON.stringify(data), {
    //   EX: 3600, // Cache for 1 hour
    // });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("getStatistics error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      stack: err.stack,
    });
  }
};
