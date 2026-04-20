const CoachActivity = require("../models/coachActivity.model");
const ClientProgress = require("../models/clientProgress.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

const isBlank = (value) =>
  value === undefined || value === null || value === "";

const parseOptionalNumber = (value) => {
  if (isBlank(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeMeasurements = (measurements = {}) => {
  const measurementKeys = ["chest", "waist", "hips", "arms", "thighs"];
  const normalized = {};

  for (const key of measurementKeys) {
    const parsedValue = parseOptionalNumber(measurements[key]);
    if (Number.isNaN(parsedValue)) {
      return { error: `Invalid ${key} measurement` };
    }

    if (parsedValue !== undefined) {
      normalized[key] = parsedValue;
    }
  }

  return { data: normalized };
};

// Log coach activity (helper function)
exports.logActivity = async (coachId, activityType, description, relatedTo = null, metadata = {}) => {
  try {
    const activity = new CoachActivity({
      coachId,
      activityType,
      description,
      relatedTo,
      metadata,
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

// Get coach activity timeline
exports.getCoachActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, from, to, limit = 50 } = req.query;

    const query = { coachId: id };

    // Filter by activity type
    if (type) {
      query.activityType = type;
    }

    // Filter by date range
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const activities = await CoachActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get activity stats
exports.getActivityStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await CoachActivity.aggregate([
      { $match: { coachId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$activityType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalActivities = await CoachActivity.countDocuments({ coachId: id });

    // Last 7 days activity
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentActivities = await CoachActivity.countDocuments({
      coachId: id,
      createdAt: { $gte: last7Days },
    });

    res.status(200).json({
      success: true,
      data: {
        totalActivities,
        recentActivities,
        byType: stats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get client progress
exports.getClientProgress = async (req, res) => {
  try {
    const { id, clientId } = req.params;

    const progress = await ClientProgress.findOne({
      coachId: id,
      clientId: clientId,
    })
      .populate("clientId", "name email")
      .populate("coachId", "name email")
      .lean();

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress data not found",
      });
    }

    // Calculate progress percentage
    const progressDoc = await ClientProgress.findById(progress._id);
    const progressPercentage = progressDoc.calculateProgress();
    const derivedStatus =
      progress.status === "paused"
        ? "paused"
        : progressPercentage >= 100
          ? "completed"
          : "active";

    res.status(200).json({
      success: true,
      data: {
        ...progress,
        status: derivedStatus,
        progressPercentage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all clients progress for a coach
exports.getAllClientsProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const progressList = await ClientProgress.find({ coachId: id })
      .populate("clientId", "name email profilePicture")
      .sort({ updatedAt: -1 })
      .lean();

    // Calculate progress percentage for each
    const progressWithPercentage = await Promise.all(
      progressList.map(async (progress) => {
        const progressDoc = await ClientProgress.findById(progress._id);
        const progressPercentage = progressDoc.calculateProgress();
        const derivedStatus =
          progress.status === "paused"
            ? "paused"
            : progressPercentage >= 100
              ? "completed"
              : "active";
        return {
          ...progress,
          status: derivedStatus,
          progressPercentage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: progressWithPercentage.length,
      data: progressWithPercentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create/Initialize client progress
exports.createClientProgress = async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { goals, initialStats } = req.body;

    // Check if progress already exists
    const existing = await ClientProgress.findOne({
      coachId: id,
      clientId: clientId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Progress tracking already exists for this client",
      });
    }

    const weight = parseOptionalNumber(initialStats?.weight);
    const bodyFat = parseOptionalNumber(initialStats?.bodyFat);

    if (Number.isNaN(weight) || Number.isNaN(bodyFat)) {
      return res.status(400).json({
        success: false,
        message: "Weight and body fat must be valid numbers",
      });
    }

    if (weight === undefined && bodyFat === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please add weight or body fat percentage",
      });
    }

    const { data: measurements, error: measurementsError } =
      normalizeMeasurements(initialStats?.measurements);

    if (measurementsError) {
      return res.status(400).json({
        success: false,
        message: measurementsError,
      });
    }

    const normalizedInitialStats = {
      ...(weight !== undefined ? { weight } : {}),
      ...(bodyFat !== undefined ? { bodyFat } : {}),
      ...(Object.keys(measurements).length > 0 ? { measurements } : {}),
    };

    const progress = new ClientProgress({
      coachId: id,
      clientId: clientId,
      goals,
      initialStats: normalizedInitialStats,
      progressData: [
        {
          date: new Date(),
          ...(weight !== undefined ? { weight } : {}),
          ...(bodyFat !== undefined ? { bodyFat } : {}),
          ...(Object.keys(measurements).length > 0 ? { measurements } : {}),
          notes: "Initial measurement",
        },
      ],
    });

    await progress.save();

    // Log activity
    await exports.logActivity(
      id,
      "progress_updated",
      `Started tracking progress for client`,
      { type: "client", id: clientId },
      { action: "initialized" }
    );

    res.status(201).json({
      success: true,
      message: "Progress tracking initialized",
      data: progress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add progress update
exports.addProgressUpdate = async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { weight, bodyFat, measurements, photos, notes } = req.body;

    const progress = await ClientProgress.findOne({
      coachId: id,
      clientId: clientId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress tracking not found. Please initialize first.",
      });
    }

    const parsedWeight = parseOptionalNumber(weight);
    const parsedBodyFat = parseOptionalNumber(bodyFat);

    if (Number.isNaN(parsedWeight) || Number.isNaN(parsedBodyFat)) {
      return res.status(400).json({
        success: false,
        message: "Weight and body fat must be valid numbers",
      });
    }

    if (parsedWeight === undefined && parsedBodyFat === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please add weight or body fat percentage",
      });
    }

    const { data: normalizedMeasurements, error: measurementsError } =
      normalizeMeasurements(measurements);

    if (measurementsError) {
      return res.status(400).json({
        success: false,
        message: measurementsError,
      });
    }

    progress.progressData.push({
      date: new Date(),
      ...(parsedWeight !== undefined ? { weight: parsedWeight } : {}),
      ...(parsedBodyFat !== undefined ? { bodyFat: parsedBodyFat } : {}),
      ...(Object.keys(normalizedMeasurements).length > 0
        ? { measurements: normalizedMeasurements }
        : {}),
      ...(Array.isArray(photos) && photos.length > 0 ? { photos } : {}),
      ...(notes ? { notes } : {}),
    });

    await progress.save();

    // Log activity
    await exports.logActivity(
      id,
      "progress_updated",
      `Updated progress for client`,
      { type: "client", id: clientId },
      {
        ...(parsedWeight !== undefined ? { weight: parsedWeight } : {}),
        ...(parsedBodyFat !== undefined ? { bodyFat: parsedBodyFat } : {}),
      }
    );

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      data: progress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add achievement
exports.addAchievement = async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { title, description, icon } = req.body;

    const progress = await ClientProgress.findOne({
      coachId: id,
      clientId: clientId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress tracking not found",
      });
    }

    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    if (!normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: "Achievement title is required",
      });
    }

    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";
    const normalizedIcon = typeof icon === "string" ? icon.trim() : "";

    progress.achievements.push({
      title: normalizedTitle,
      ...(normalizedDescription ? { description: normalizedDescription } : {}),
      ...(normalizedIcon ? { icon: normalizedIcon } : {}),
      date: new Date(),
    });

    await progress.save();

    // Log activity
    await exports.logActivity(
      id,
      "goal_set",
      `Added achievement: ${normalizedTitle}`,
      { type: "client", id: clientId },
      { achievement: normalizedTitle }
    );

    res.status(200).json({
      success: true,
      message: "Achievement added successfully",
      data: progress,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update goals
exports.updateGoals = async (req, res) => {
  try {
    const { id, clientId } = req.params;
    const { goals } = req.body;

    const progress = await ClientProgress.findOne({
      coachId: id,
      clientId: clientId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress tracking not found",
      });
    }

    progress.goals = goals;
    await progress.save();

    // Log activity
    await exports.logActivity(
      id,
      "goal_set",
      `Updated goals for client`,
      { type: "client", id: clientId },
      { goals }
    );

    res.status(200).json({
      success: true,
      message: "Goals updated successfully",
      data: progress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = exports;
