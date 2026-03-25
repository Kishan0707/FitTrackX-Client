const User = require("../models/user.model");
const Workout = require("../models/workout.model");
const Diet = require("../models/diet.model");
const redisClient = require("../config/redis");
const bcrypt = require("bcryptjs");
const coachActivityController = require("./coachActivity.controller");
const AdminAuditLog = require("../models/adminAuditLog.model");

const buildCoachClientFilter = (coachId) => ({
  role: "user",
  $or: [{ assignedCoach: coachId }, { coachId }],
});

const VALID_MODERATION_ACTIONS = ["activate", "suspend", "ban"];

const moderationStatusMap = {
  activate: "active",
  suspend: "suspended",
  ban: "banned",
};

const moderationActionLabelMap = {
  activate: "activated",
  suspend: "suspended",
  ban: "banned",
};

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
};

const writeAdminAuditLog = async (
  req,
  { action, targetType = "system", targetId = null, description, metadata = {} },
) => {
  try {
    if (!req?.user?._id || !action || !description) {
      return;
    }

    await AdminAuditLog.create({
      adminId: req.user._id,
      action,
      targetType,
      targetId,
      description,
      metadata,
      ipAddress: getClientIp(req),
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : null,
    });
  } catch (error) {
    console.error("Admin audit log write error:", error.message);
  }
};

exports.dashBoardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Last month ke users
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);

    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: lastMonth },
    });

    // Growth percentage
    const userGrowth =
      totalUsers > 0 ? Math.round((lastMonthUsers / totalUsers) * 100) : 0;

    const totalWorkouts = await Workout.countDocuments();

    // Current month ke workouts
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthWorkouts = await Workout.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    const totalDiets = await Diet.countDocuments();
    const workouts = await Workout.find();
    const totalCaloriesBurned = workouts.reduce(
      (sum, workout) => sum + (workout.caloriesBurned || 0),
      0,
    );

    res.status(200).json({
      success: true,
      source: "database",
      data: {
        totalUsers,
        userGrowth,
        totalWorkouts,
        monthWorkouts,
        totalDiets,
        totalCaloriesBurned,
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

exports.allUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getUserModeration = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email role status moderation",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
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

exports.updateUserModeration = async (req, res) => {
  try {
    const normalizedAction =
      typeof req.body.action === "string"
        ? req.body.action.trim().toLowerCase()
        : "";
    const normalizedReason =
      typeof req.body.reason === "string" ? req.body.reason.trim() : "";

    if (!VALID_MODERATION_ACTIONS.includes(normalizedAction)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use one of: activate, suspend, ban",
      });
    }

    if (
      (normalizedAction === "suspend" || normalizedAction === "ban") &&
      !normalizedReason
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason is required for suspend or ban action",
      });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot moderate your own account",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be moderated from this route",
      });
    }

    const nextStatus = moderationStatusMap[normalizedAction];
    const actionLabel = moderationActionLabelMap[normalizedAction];
    const previousStatus = user.status;

    user.status = nextStatus;
    user.moderation = {
      action: normalizedAction === "activate" ? "none" : nextStatus,
      reason: normalizedAction === "activate" ? null : normalizedReason,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    };

    await user.save();

    await writeAdminAuditLog(req, {
      action: `user_${actionLabel}`,
      targetType: user.role === "coach" ? "coach" : "user",
      targetId: user._id,
      description: `Admin ${actionLabel} account ${user.email}`,
      metadata: {
        previousStatus,
        newStatus: nextStatus,
        reason: normalizedAction === "activate" ? null : normalizedReason,
      },
    });

    res.status(200).json({
      success: true,
      message: `User ${actionLabel} successfully`,
      data: user,
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

exports.getAdminAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      targetType,
      adminId,
      from,
      to,
    } = req.query;

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const perPage =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 20;

    const query = {};

    if (action) {
      query.action = String(action).trim();
    }
    if (targetType) {
      query.targetType = String(targetType).trim();
    }
    if (adminId) {
      query.adminId = adminId;
    }

    if (from || to) {
      query.createdAt = {};

      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid 'from' date",
          });
        }
        query.createdAt.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid 'to' date",
          });
        }
        query.createdAt.$lte = toDate;
      }
    }

    const skip = (currentPage - 1) * perPage;

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query)
        .populate("adminId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      AdminAuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      data: logs,
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

exports.deleteUsers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email role status moderation",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await writeAdminAuditLog(req, {
      action: "user_deleted",
      targetType: user.role === "coach" ? "coach" : "user",
      targetId: user._id,
      description: `Admin deleted ${user.role} account ${user.email}`,
      metadata: {
        name: user.name,
        email: user.email,
        status: user.status,
        moderation: user.moderation || null,
      },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
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

exports.getAllWorkout = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit);
    const workouts = await Workout.find()
      .populate("userId", "name email")
      .select("type caloriesBurned duration createdAt exercises userId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getUserGrowthChart = async (req, res) => {
  try {
    const months = [];
    const data = [];

    // Last 12 months ka data
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthName = date.toLocaleString("default", { month: "short" });
      months.push(monthName);

      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextMonth },
      });

      data.push(count);
    }

    res.status(200).json({
      success: true,
      data: {
        months,
        users: data,
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

exports.getWorkoutDistribution = async (req, res) => {
  try {
    const workouts = await Workout.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const chartData = workouts.map((w) => ({
      name: w._id || "Other",
      value: w.count,
    }));

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllDiets = async (req, res) => {
  try {
    const diets = await Diet.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      count: diets.length,
      data: diets,
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

exports.createDiet = async (req, res) => {
  try {
    const { userId, mealName, calories, protein, carbs, fat, meals } = req.body;
    const diet = new Diet({
      userId,
      mealName,
      calories,
      protein,
      carbs,
      fat,
      meals,
    });
    await diet.save();
    await diet.populate("userId", "name email");
    res.status(201).json({
      success: true,
      message: "Diet plan created successfully",
      data: diet,
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

exports.updateDiet = async (req, res) => {
  try {
    const diet = await Diet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("userId", "name email");
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diet not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Diet updated successfully",
      data: diet,
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

exports.deleteDiet = async (req, res) => {
  try {
    const diet = await Diet.findByIdAndDelete(req.params.id);
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diet not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Diet deleted successfully",
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

exports.getUserActivityReport = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentActiveUsers = await Workout.distinct("userId", {
      createdAt: { $gte: last30Days },
    });

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        recentActiveUsers: recentActiveUsers.length,
        usersByRole,
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

exports.getWorkoutReport = async (req, res) => {
  try {
    const totalWorkouts = await Workout.countDocuments();

    const workoutsByType = await Workout.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalCaloriesBurned = await Workout.aggregate([
      { $group: { _id: null, total: { $sum: "$caloriesBurned" } } },
    ]);

    const avgDuration = await Workout.aggregate([
      { $group: { _id: null, avg: { $avg: "$duration" } } },
    ]);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentWorkouts = await Workout.countDocuments({
      createdAt: { $gte: last7Days },
    });

    res.status(200).json({
      success: true,
      data: {
        totalWorkouts,
        workoutsByType,
        totalCaloriesBurned: totalCaloriesBurned[0]?.total || 0,
        avgDuration: Math.round(avgDuration[0]?.avg || 0),
        recentWorkouts,
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

exports.getDietAdherenceReport = async (req, res) => {
  try {
    const totalDiets = await Diet.countDocuments();

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentDiets = await Diet.countDocuments({
      createdAt: { $gte: last30Days },
    });

    const avgCalories = await Diet.aggregate([
      { $group: { _id: null, avg: { $avg: "$totalCalories" } } },
    ]);

    const avgProtein = await Diet.aggregate([
      { $group: { _id: null, avg: { $avg: "$totalProtein" } } },
    ]);

    const usersWithDiets = await Diet.distinct("userId");

    res.status(200).json({
      success: true,
      data: {
        totalDiets,
        recentDiets,
        avgCalories: Math.round(avgCalories[0]?.avg || 0),
        avgProtein: Math.round(avgProtein[0]?.avg || 0),
        usersWithDiets: usersWithDiets.length,
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

exports.getRevenueReport = async (req, res) => {
  try {
    const Subscription = require("../models/subscription.model");

    const totalRevenue = await Subscription.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const monthlyRevenue = await Subscription.aggregate([
      { $match: { status: "completed", createdAt: { $gte: last30Days } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const paymentsByPlan = await Subscription.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$planType",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const totalPayments = await Subscription.countDocuments({
      status: "active",
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        paymentsByPlan,
        totalPayments,
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

exports.getRecentActivities = async (req, res) => {
  try {
    const limit = 10;

    // Get recent users
    const recentUsers = await User.find()
      .select("name email createdAt role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const userActivities = recentUsers.map((user) => ({
      type: "user_signup",
      description: `New user ${user.name} signed up`,
      user: user.name,
      timestamp: user.createdAt,
      icon: "user",
    }));

    // Get recent workouts
    const recentWorkouts = await Workout.find()
      .populate("userId", "name")
      .select("type caloriesBurned createdAt userId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const workoutActivities = recentWorkouts.map((workout) => ({
      type: "workout_added",
      description: `${workout.userId?.name} added a ${workout.type} workout`,
      user: workout.userId?.name,
      timestamp: workout.createdAt,
      icon: "dumbbell",
    }));

    // Get recent diets
    const recentDiets = await Diet.find()
      .populate("userId", "name")
      .select("createdAt userId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const dietActivities = recentDiets.map((diet) => ({
      type: "diet_created",
      description: `${diet.userId?.name} created a diet plan`,
      user: diet.userId?.name,
      timestamp: diet.createdAt,
      icon: "apple",
    }));

    // Combine and sort by timestamp
    const allActivities = [
      ...userActivities,
      ...workoutActivities,
      ...dietActivities,
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: allActivities,
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

exports.getTopPerformers = async (req, res) => {
  try {
    // Top users by workouts
    const topUsersByWorkouts = await Workout.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          totalCalories: { $sum: "$caloriesBurned" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          email: "$user.email",
          workouts: "$count",
          totalCalories: 1,
        },
      },
    ]);

    // Top coaches by clients (supports both assignedCoach + coachId mapping)
    const topCoaches = await User.aggregate([
      {
        $match: {
          role: "user",
          $or: [{ assignedCoach: { $ne: null } }, { coachId: { $ne: null } }],
        },
      },
      {
        $project: {
          coachRef: { $ifNull: ["$assignedCoach", "$coachId"] },
        },
      },
      {
        $group: {
          _id: "$coachRef",
          clientsCount: { $sum: 1 },
        },
      },
      { $sort: { clientsCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "coach",
        },
      },
      { $unwind: "$coach" },
      {
        $project: {
          _id: 1,
          name: "$coach.name",
          email: "$coach.email",
          clientsCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        topUsersByWorkouts,
        topCoaches,
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

exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require("mongoose");

    // Check database connection
    const dbStatus =
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

    // Check Redis connection
    let redisStatus = "Disconnected";
    try {
      await redisClient.ping();
      redisStatus = "Connected"; //
    } catch (err) {
      redisStatus = "Disconnected";
    }

    // Server uptime
    const uptime = process.uptime();
    const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // CPU usage (approximate)
    const cpuUsage = process.cpuUsage();

    // API response time (simple check)
    const startTime = Date.now();
    await User.findOne().limit(1);
    const responseTime = Date.now() - startTime;

    // Overall health status
    const isHealthy = dbStatus === "Connected" && redisStatus === "Connected";

    res.status(200).json({
      success: true,
      data: {
        status: isHealthy ? "Healthy" : "Unhealthy",
        timestamp: new Date().toISOString(),
        server: {
          status: "Running",
          uptime: uptimeFormatted,
          uptimeSeconds: Math.floor(uptime),
          nodeVersion: process.version,
          platform: process.platform,
        },
        database: {
          status: dbStatus,
          type: "MongoDB",
        },
        redis: {
          status: redisStatus,
        },
        memory: {
          used: `${memoryUsedMB} MB`,
          total: `${memoryTotalMB} MB`,
          percentage: Math.round((memoryUsedMB / memoryTotalMB) * 100),
        },
        api: {
          responseTime: `${responseTime}ms`,
          status: responseTime < 1000 ? "Fast" : "Slow",
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

// Coach Management Functions

exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await User.find({ role: "coach" })
      .select("-password")
      .lean();

    // Get client count for each coach
    const coachesWithStats = await Promise.all(
      coaches.map(async (coach) => {
        const clientCount = await User.countDocuments(
          buildCoachClientFilter(coach._id),
        );
        return { ...coach, clientCount };
      }),
    );

    res.status(200).json({
      success: true,
      count: coachesWithStats.length,
      data: coachesWithStats,
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

exports.createCoach = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      experience,
      bio,
      status,
    } = req.body;

    // Check if coach already exists
    const existingCoach = await User.findOne({ email });
    if (existingCoach) {
      return res.status(400).json({
        success: false,
        message: "Coach with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create coach
    const coach = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "coach",
      specialization,
      experience,
      bio,
      status: status || "active",
    });

    await coach.save();

    res.status(201).json({
      success: true,
      message: "Coach created successfully",
      data: {
        _id: coach._id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        specialization: coach.specialization,
        experience: coach.experience,
        bio: coach.bio,
        status: coach.status,
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
// update coach

exports.updateCoach = async (req, res) => {
  try {
    const { name, email, phone, specialization, experience, bio, status } =
      req.body;

    const coach = await User.findById(req.params.id);
    if (!coach || coach.role !== "coach") {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    // Update fields
    if (name) coach.name = name;
    if (email) coach.email = email;
    if (phone) coach.phone = phone;
    if (specialization) coach.specialization = specialization;
    if (experience) coach.experience = experience;
    if (bio) coach.bio = bio;
    if (status) coach.status = status;

    await coach.save();

    res.status(200).json({
      success: true,
      message: "Coach updated successfully",
      data: {
        _id: coach._id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        specialization: coach.specialization,
        experience: coach.experience,
        bio: coach.bio,
        status: coach.status,
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

exports.deleteCoach = async (req, res) => {
  try {
    const coach = await User.findById(req.params.id);
    if (!coach || coach.role !== "coach") {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    // Unassign all clients
    await User.updateMany(
      {
        role: "user",
        $or: [{ assignedCoach: coach._id }, { coachId: coach._id }],
      },
      { $unset: { assignedCoach: "", coachId: "" } },
    );

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Coach deleted successfully",
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

exports.getCoachDetails = async (req, res) => {
  try {
    const coach = await User.findById(req.params.id).select("-password").lean();
    if (!coach || coach.role !== "coach") {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    // Get clients
    const clients = await User.find(buildCoachClientFilter(coach._id))
      .select("name email phone createdAt status")
      .lean();

    // Get performance metrics
    const clientIds = clients.map((client) => client._id);
    let totalWorkoutsCreated = 0;
    let totalDietsCreated = 0;
    const activeClientsCount = clients.filter(
      (client) => client.status === "active",
    ).length;
    const retentionRate =
      clients.length > 0
        ? Math.round((activeClientsCount / clients.length) * 100)
        : null;

    if (clientIds.length > 0) {
      [totalWorkoutsCreated, totalDietsCreated] = await Promise.all([
        Workout.countDocuments({
          userId: { $in: clientIds },
        }),
        Diet.countDocuments({
          userId: { $in: clientIds },
        }),
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        ...coach,
        clientCount: clients.length,
        clients,
        performance: {
          totalWorkoutsCreated,
          totalDietsCreated,
          retentionRate,
          activeClientsCount,
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

exports.getCoachClients = async (req, res) => {
  try {
    const clients = await User.find(buildCoachClientFilter(req.params.id))
      .select("name email phone createdAt")
      .lean();

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
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

exports.assignClientToCoach = async (req, res) => {
  try {
    const { clientId } = req.body;
    const coachId = req.params.id;

    const coach = await User.findById(coachId);
    if (!coach || coach.role !== "coach") {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const previousCoachId = client.assignedCoach || client.coachId;
    client.assignedCoach = coachId;
    client.coachId = coachId;
    await client.save();

    // Keep denormalized clients array in sync
    if (
      previousCoachId &&
      previousCoachId.toString() !== coachId.toString()
    ) {
      await User.updateOne(
        { _id: previousCoachId, role: "coach" },
        { $pull: { clients: client._id } },
      );
    }

    await User.updateOne(
      { _id: coachId, role: "coach" },
      {   ToSet: { clients: client._id } },
    );

    // Log activity
    await coachActivityController.logActivity(
      coachId,
      "client_assigned",
      `New client ${client.name} assigned`,
      { type: "client", id: clientId },
      { clientName: client.name, clientEmail: client.email },
    );

    res.status(200).json({
      success: true,
      message: "Client assigned to coach successfully",
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

exports.unassignClientFromCoach = async (req, res) => {
  try {
    const { clientId } = req.body;

    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const linkedCoachId = client.assignedCoach || client.coachId || req.params.id;
    client.assignedCoach = undefined;
    client.coachId = undefined;
    await client.save();

    // Keep denormalized clients array in sync
    if (linkedCoachId) {
      await User.updateOne(
        { _id: linkedCoachId, role: "coach" },
        { $pull: { clients: client._id } },
      );
    }

    // Log activity
    await coachActivityController.logActivity(
      req.params.id,
      "client_unassigned",
      `Client ${client.name} unassigned`,
      { type: "client", id: clientId },
      { clientName: client.name },
    );

    res.status(200).json({
      success: true,
      message: "Client unassigned successfully",
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
