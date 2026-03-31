const User = require("../models/user.model");
const Workout = require("../models/workout.model");
const Bodymeasurements = require("../models/bodyMeasurement.model");
const { Plan } = require("../models/plan.model");
const redisClient = require("../config/redis");
const clients = require("../models/user.model");
const Subscription = require("../models/subscription.model");
const Session = require("../models/session.model");

exports.requestCoach = async (req, res) => {
  try {
    const { coachId } = req.body;

    const coach = await User.findById(coachId);

    if (!coach || coach.role !== "coach") {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    const user = await User.findById(req.user._id);
    const previousCoachId = user.assignedCoach || user.coachId;
    user.coachId = coachId;
    user.assignedCoach = coachId;
    await user.save();

    if (
      previousCoachId &&
      previousCoachId.toString() !== coachId.toString()
    ) {
      await User.updateOne(
        { _id: previousCoachId, role: "coach" },
        { $pull: { clients: user._id } },
      );
    }

    await User.updateOne(
      { _id: coachId, role: "coach" },
      { $addToSet: { clients: user._id } },
    );

    res.status(200).json({
      success: true,
      message: "Coach Assigned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getMyCoach = async (req, res) => {
  try {
    // Get all clients assigned to this coach
    const coachClientFilter = {
      role: "user",
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    };
    const clients = await User.find(coachClientFilter).select("_id name email").lean();
    
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

exports.assignWorkout = async (req, res) => {
  try {
    const { userId, type, exercises } = req.body;
    const workout = await Workout.create({
      userId,
      type,
      exercises,
      caloriesBurned: 0,
    });
    // await workout.save();
    res.status(200).json({
      success: true,
      message: "Workout assigned successfully",
      data: workout,
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

exports.clientProgress = async (req, res) => {
  try {
    const progress = await Bodymeasurements.find({
      userId: req.params.userId,
    }).sort({
      createdAt: 1,
    });
    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.assignMember = async (req, res) => {
  try {
    const { planId, memberId } = req.body;
    const Plans = await Plan.findById(planId);
    if (!Plans) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }
    Plans.members.push(memberId);
    await Plans.save();
    res.status(200).json({
      success: true,
      message: "Member assigned successfully",
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const coach = await User.findById(req.user._id).populate(
      "members",
      "name email weight goal",
    );

    const cacheKey = req.cacheKey || `coach-members:${req.user._id}`;
    if (redisClient && typeof redisClient.set === "function") {
      try {
        await redisClient.set(cacheKey, JSON.stringify(coach.members), {
          ex: 3600,
        });
      } catch (cacheErr) {
        console.error("Redis set error in getMembers:", cacheErr);
      }
    }

    res.status(200).json({
      success: true,
      count: coach.members.length,
      source: "database",
      data: coach.members,
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const coach = await User.findById(req.user._id);
    if (coach.role !== "coach") {
      return res.status(400).json({
        success: false,
        message: "Only coach can remove members",
      });
    }
    coach.members = coach.members.filter(
      (member) => member.toString() !== memberId,
    );
    await coach.save();
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        error: err.message,
      });
    } else {
      member.coachId = null;
      await member.save();
    }

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (err) {
    console.log("====================================");
    console.log(err);
    console.log("====================================");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const coachClientFilter = {
      role: "user",
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    };
    const totalClients = await User.countDocuments(coachClientFilter);
    const clients = await User.find(coachClientFilter).lean();
    const activeClientsCount = Array.isArray(clients)
      ? clients.filter((client) => client.status === "active").length
      : 0;
    const clientIds = clients.map((client) => client._id);
    const activePlans = await Plan.countDocuments({ coachId: req.user._id });
    // For monthly sessions, this might need more logic, for now just count workouts assigned this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthlySessions = await Workout.countDocuments({
      userId: { $in: clientIds },
      createdAt: { $gte: startOfMonth },
    });
    const revenue = await Subscription.aggregate([
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "planDetails"
        }
      },
      {
        $unwind: "$planDetails"
      },
      {
        $match: {
          "planDetails.coachId": req.user._id,
          status: { $in: ["active", "completed"] }
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ["active", "completed"] },
          createdAt: { $gte: last30Days }
        }
      },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);


    if (redisClient && typeof redisClient.set === "function" && req.cacheKey) {
      try {
        await redisClient.set(
          req.cacheKey,
          JSON.stringify({
            totalClients,
            activePlans,
            monthlySessions,
          }),
          {
            ex: 3600, // Cache for 1 hour
          },
        );
      } catch (cacheErr) {
        console.error("Redis set error in dashboardStats:", cacheErr);
      }
    }

    res.status(200).json({
      success: true,
      source: "database",
      data: {
        totalClients,
        activePlans,
        monthlySessions,
        activeClientsCount,
        revenue: revenue[0]?.totalRevenue || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
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
exports.createSessions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { clientId, title, date, duration, notes } = req.body;

    // Validate required fields
    if (!clientId || clientId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "clientId is required and cannot be empty",
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date is required",
      });
    }

    const session = await Session.create({
      clientId,
      title,
      date,
      duration: duration || 60,
      notes: notes || "",
      coachId: req.user._id,
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Session not created",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: "Validation error",
      error: err.message,
    });
  }
};
exports.getSessions = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const sessions = await Session.find({
      coachId: req.user._id,
    }).populate("clientId", " clientId name email");
    if (!sessions || sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sessions found",
      });
    }
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
}
exports.deleteSessions = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
}