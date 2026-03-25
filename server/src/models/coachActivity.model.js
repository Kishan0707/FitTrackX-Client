const mongoose = require("mongoose");

const coachActivitySchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      enum: [
        "client_assigned",
        "client_unassigned",
        "workout_created",
        "diet_created",
        "session_completed",
        "profile_updated",
        "message_sent",
        "goal_set",
        "progress_updated",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedTo: {
      type: {
        type: String,
        enum: ["client", "workout", "diet", "session", "progress"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for faster queries
coachActivitySchema.index({ coachId: 1, createdAt: -1 });
coachActivitySchema.index({ activityType: 1 });

module.exports = mongoose.model("CoachActivity", coachActivitySchema);
