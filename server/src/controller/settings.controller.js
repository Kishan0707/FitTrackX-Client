const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email phone bio profilePicture preferences privacy notifications"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
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

// Update Profile Settings
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, bio },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
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

// Update Preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, language, units, timezone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        preferences: {
          theme,
          language,
          units,
          timezone,
        },
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: user,
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

// Update Privacy Settings
exports.updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility, showWorkoutHistory, showDietPlans } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        privacy: {
          profileVisibility,
          showWorkoutHistory,
          showDietPlans,
        },
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully",
      data: user,
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

// Update Notification Settings
exports.updateNotifications = async (req, res) => {
  try {
    const {
      emailNotifications,
      workoutReminders,
      dietReminders,
      pushNotifications,
    } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        notifications: {
          emailNotifications,
          workoutReminders,
          dietReminders,
          pushNotifications,
        },
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: user,
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

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check old password
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
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

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
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

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // File path (assuming multer stores in public/uploads)
    const profilePicture = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: user,
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
