// const bodyMeasurementModel = require( "../models/bodyMeasurement.model" );
const bodyMeasurement = require("../models/bodyMeasurement.model");

exports.createBodyMeasurement = async (req, res) => {
  try {
    const {
      chest,
      weight,
      height,
      waist,
      hips,
      thighs,
      arms,
      forearms,
      biceps,
      bodyFat,
      userId,
    } = req.body;
    const measurement = await bodyMeasurement.create({
      userId: req.user._id,
      weight,
      height,
      chest,
      waist,
      hips,
      thighs,
      arms,
      forearms,
      biceps,
      bodyFat,
    });
    res.status(201).json({
      success: true,
      data: measurement,
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

exports.getAllBodyMeasurements = async (req, res) => {
  try {
    const measurements = await bodyMeasurement.find({ userId: req.user._id });
    res.status(200).json({
      success: true,
      data: measurements,
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

exports.getLatestBodyMeasurement = async (req, res) => {
  try {
    const measurement = await bodyMeasurement
      .findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: measurement,
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
exports.deleteBodyMeasurement = async (req, res) => {
  try {
    const { id } = req.params;
    const measurement = await bodyMeasurement
      .findByIdAndDelete(req.params.id)
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      data: measurement,
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

exports.updateBodyMeasurement = async (req, res) => {
  try {
    const measurement = await bodyMeasurement.findById(req.params.id);
    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: "Measurement not found",
      });
    }

    if (measurement.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this measurement",
      });
    }
    const updated = await bodyMeasurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getMeasurementHHistory = async (req, res) => {
  try {
    const history = await bodyMeasurement
      .find(
        {
          userId: req.user._id,
        },
        {
          weight: 1, // Include weight in the results
          height: 1, // Include height in the results
          bodyFat: 1, // Include bodyFat in the results
          createdAt: 1, // Include createdAt in the results
        },
      )
      .sort({ createdAt: 1 }); // Sort by date ascending to show history in chronological order
    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
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
