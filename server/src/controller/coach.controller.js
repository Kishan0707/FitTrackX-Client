const User = require("../models/user.model");
const Workout = require("../models/workout.model");
const Bodymeasurements = require("../models/bodyMeasurement.model");
const Diet = require("../models/diet.model");
const Steps = require("../models/steps.model");
const { Plan } = require("../models/plan.model");
const redisClient = require("../config/redis");
const clients = require("../models/user.model");
const Subscription = require("../models/subscription.model");
const Session = require("../models/session.model");

exports.requestCoach = async (req, res) => {
  try {
    const { coachId, target } = req.body;
    const coach = await User.findById(coachId);
    if (!coach || coach.role !== "coach")
      return res
        .status(404)
        .json({ success: false, message: "Coach not found" });

    await User.findByIdAndUpdate(req.user._id, {
      coachRequest: { coachId, status: "pending", target: target || null },
    });

    res.status(200).json({ success: true, message: "Request sent to coach" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await User.find({
      "coachRequest.coachId": req.user._id,
      "coachRequest.status": "pending",
    }).select("name email coachRequest");
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { clientId, action } = req.body; // action: "accepted" | "rejected"
    const client = await User.findOne({
      _id: clientId,
      "coachRequest.coachId": req.user._id,
      "coachRequest.status": "pending",
    });
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });

    client.coachRequest.status = action;
    if (action === "accepted") {
      client.coachId = req.user._id;
      client.assignedCoach = req.user._id;
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { clients: clientId },
      });
    }
    await client.save();

    res.status(200).json({ success: true, message: `Request ${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyCoachRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("coachRequest")
      .populate("coachRequest.coachId", "name email specialization");
    res.status(200).json({ success: true, data: user.coachRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyCoach = async (req, res) => {
  try {
    // Get all clients assigned to this coach
    const coachClientFilter = {
      role: "user",
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    };
    const clients = await User.find(coachClientFilter)
      .select("_id name email goal")
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

exports.coachReport = async (req, res) => {
  try {
    const coachId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const coachClientFilter = {
      role: "user",
      $or: [{ assignedCoach: coachId }, { coachId: coachId }],
    };

    const [clients, sessions, workouts, diets, steps] = await Promise.all([
      User.find(coachClientFilter).select(
        "name email status goal weight createdAt",
      ),
      Session.find({ coachId }).populate("clientId", "name"),
      Workout.find({ coachId }).sort({ createdAt: -1 }),
      Diet.find({ coachId }).sort({ date: -1 }),
      Steps.find({ coachId }).sort({ date: -1 }),
    ]);

    const recentSessions = sessions.filter((s) => new Date(s.date) >= since);
    const sessionsByStatus = [
      "pending",
      "accepted",
      "rejected",
      "completed",
      "scheduled",
    ].map((st) => ({
      status: st,
      count: sessions.filter((s) => s.status === st).length,
    }));

    const workoutsByType = workouts.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {});

    const totalCalories = workouts.reduce(
      (s, w) => s + (w.caloriesBurned || 0),
      0,
    );
    const avgProtein =
      diets.length ?
        (
          diets.reduce((s, d) => s + (d.totalProtein || 0), 0) / diets.length
        ).toFixed(1)
      : 0;

    const stepsMetGoal = steps.filter((s) => s.steps >= s.goal).length;

    res.status(200).json({
      success: true,
      data: {
        clients: { total: clients.length, list: clients },
        sessions: {
          total: sessions.length,
          recent: recentSessions.length,
          byStatus: sessionsByStatus,
        },
        workouts: {
          total: workouts.length,
          totalCalories,
          byType: Object.entries(workoutsByType).map(([type, count]) => ({
            type,
            count,
          })),
        },
        diet: { total: diets.length, avgProtein },
        steps: { total: steps.length, metGoal: stepsMetGoal },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clientDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const client = await User.findOne({
      _id: userId,
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    }).select("name email goal weight height");

    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [steps, todaySteps, workouts, diets, measurements] =
      await Promise.all([
        Steps.find({ userId }).sort({ date: 1 }).select("steps goal date"),
        Steps.findOne({ userId, date: { $gte: today } }).select("steps goal"),
        Workout.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("title type status caloriesBurned duration date exercises"),
        Diet.find({ userId })
          .sort({ date: -1 })
          .limit(7)
          .select("date totalCalories totalProtein totalCarbs totalFat meals"),
        Bodymeasurements.find({ userId })
          .sort({ date: -1 })
          .limit(10)
          .select("weight bodyFat date"),
      ]);

    res.status(200).json({
      success: true,
      data: { client, steps, todaySteps, workouts, diets, measurements },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clientProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify this client belongs to the coach
    const client = await User.findOne({
      _id: userId,
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    }).select("name email goal weight");

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    const [measurements, workouts, diets] = await Promise.all([
      Bodymeasurements.find({ userId })
        .sort({ createdAt: 1 })
        .select("weight bodyFat createdAt"),
      Workout.find({ userId })
        .sort({ createdAt: 1 })
        .select("caloriesBurned createdAt"),
      Diet.find({ userId })
        .sort({ createdAt: 1 })
        .select("totalProtein createdAt"),
    ]);

    const weightHistory = measurements.map((m) => ({
      weight: m.weight,
      date: m.createdAt,
    }));

    const caloriesBurned = workouts.map((w) => ({
      calories: w.caloriesBurned,
      date: w.createdAt,
    }));

    const proteinIntake = diets.map((d) => ({
      protein: d.totalProtein,
      date: d.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        client,
        weightHistory,
        caloriesBurned,
        proteinIntake,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
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
    const activeClientsCount =
      Array.isArray(clients) ?
        clients.filter((client) => client.status === "active").length
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
          as: "planDetails",
        },
      },
      {
        $unwind: "$planDetails",
      },
      {
        $match: {
          "planDetails.coachId": req.user._id,
          status: { $in: ["active", "completed"] },
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
          createdAt: { $gte: last30Days },
        },
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
};
exports.getClientSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ clientId: req.user._id })
      .populate("coachId", "name email")
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respondSession = async (req, res) => {
  try {
    const { action } = req.body; // accepted | rejected
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, clientId: req.user._id, status: "pending" },
      { status: action },
      { new: true },
    );
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      session.coachId.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const allowedFields = [
      "title",
      "clientId",
      "date",
      "duration",
      "notes",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        session[field] = req.body[field];
      }
    });

    await session.save();

    const updatedSession = await Session.findById(session._id).populate(
      "clientId",
      "name email",
    );

    res.status(200).json({
      success: true,
      data: updatedSession,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: err.message || "Failed to update session",
    });
  }
};

exports.deleteSessions = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      session.coachId.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    await session.deleteOne();

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
};
