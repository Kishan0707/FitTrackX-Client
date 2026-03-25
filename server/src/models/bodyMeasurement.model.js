const mongoose = require("mongoose");

const bodyMeasurementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    height: {
      type: Number,
      required: true,
    },

    weight: {
      type: Number,
      required: true,
    },

    chest: {
      type: Number,
      required: true,
    },

    waist: {
      type: Number,
      required: true,
    },

    hips: {
      type: Number,
      required: true,
    },

    thighs: {
      type: Number,
      required: true,
    },

    arms: {
      type: Number,
      required: true,
    },

    forearms: {
      type: Number,
      required: true,
    },

    biceps: {
      type: Number,
      required: true,
    },

    bodyFat: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("BodyMeasurement", bodyMeasurementSchema);
