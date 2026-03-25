const User = require("../models/user.model");
const Workout = require("../models/workout.model");
const Bodymeasurements = require("../models/bodyMeasurement.model");
const { Plan } = require("../models/plan.model");
const redisClient = require("../config/redis");

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
    const coache = await User.findById(req.user._id).populate(
      "coachId",
      "name email",
    );
    res.status(200).json({
      success: true,
      count: coache.length,
      data: coache.clients,
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
    await redisClient.set(req.cacheKey, JSON.stringify(coach.members), {
      EX: 3600, // Cache for 1 hour
    });

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
    const clientDocs = await User.find(coachClientFilter).select("_id").lean();
    const clientIds = clientDocs.map((client) => client._id);
    const activePlans = await Plan.countDocuments({ coachId: req.user._id });
    // For monthly sessions, this might need more logic, for now just count workouts assigned this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthlySessions = await Workout.countDocuments({
      userId: { $in: clientIds },
      createdAt: { $gte: startOfMonth },
    });

    await redisClient.set(
      req.cacheKey,
      JSON.stringify({
        totalClients,
        activePlans,
        monthlySessions,
      }),
      {
        EX: 3600, // Cache for 1 hour
      },
    );

    res.status(200).json({
      success: true,
      source: "database",
      data: {
        totalClients,
        activePlans,
        monthlySessions,
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
