const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tipId: {
      type: Number,
      required: true,
    },
    stepId: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, tipId: 1, stepId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
