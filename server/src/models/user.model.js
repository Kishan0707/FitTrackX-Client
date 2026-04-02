const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "invalid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // exclude password from query results by default
    },
    role: {
      type: String,
      enum: ["user", "coach", "admin"],
      default: "user",
    },
    age: Number,
    height: Number,
    weight: Number,
    goal: {
      type: String,
      enum: ["lose weight", "bulk", "cut", "maintain", "gain weight"],
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedCoach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    coachRequest: {
      coachId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: null },
      target: { type: String, default: null },
    },
    specialization: {
      type: String,
      default: null,
    },
    experience: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed", "suspended", "banned"],
      default: "active",
    },
    moderation: {
      action: {
        type: String,
        enum: ["none", "suspended", "banned"],
        default: "none",
      },
      reason: {
        type: String,
        default: null,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    clients: [
      // coach ke clients ka reference
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subscription: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    workoutStreak: {
      type: Number,
      default: 0,
    },
    lastWorkoutDate: {
      type: Date,
      default: null,
    },
    userGrowth: {
      type: Number,
      default: 0,
    },
    iaActive: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark",
      },
      language: {
        type: String,
        enum: ["en", "hi", "de", "es", "fr"],
        default: "en",
      },
      units: {
        type: String,
        enum: ["metric", "imperial"],
        default: "metric",
      },
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "private",
      },
      showWorkoutHistory: {
        type: Boolean,
        default: false,
      },
      showDietPlans: {
        type: Boolean,
        default: false,
      },
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      workoutReminders: {
        type: Boolean,
        default: true,
      },
      dietReminders: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

// Hash password before saving

// ! Salt kya hota?
//? Salt = random string jo password ko aur secure banata hai.
// ?Example:
//? Password: 123456
//? Salt: xYz9!@
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// !matchPassword Method
//^ methods = custom function jo har user document pe available hoga.
//~ example : const user = await User.findOne({ email }).select("+password");
//~           user.matchPassword("123456");

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
