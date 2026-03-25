const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    plan: {
      type: String,
      enum: [
        "basic",
        "standard",
        "pro",
        "premium",
        "elite",
        "ultimate",
        "vip",
        "enterprise",
      ],
      default: "basic",
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
// enum to restrict status to specific values || validation error...
