const { sendEmail, emailTemplates } = require("../config/email");
const User = require("../models/user.model");

exports.sendWelcomeEmail = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: "Welcome to FitTrack!",
      html: emailTemplates.welcome(user.name),
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

exports.sendWorkoutReminder = async (req, res) => {
  try {
    const { workoutType } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const result = await sendEmail({
      to: user.email,
      subject: "Workout Reminder",
      html: emailTemplates.workoutReminder(user.name, workoutType),
    });

    res.status(200).json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendGoalAchievedEmail = async (userId, goal) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: "Goal Achieved!",
      html: emailTemplates.goalAchieved(user.name, goal),
    });
  } catch (error) {
    console.error("Error sending goal achieved email:", error);
  }
};

exports.sendSubscriptionEmail = async (userId, planName, duration) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    await sendEmail({
      to: user.email,
      subject: "Subscription Confirmed",
      html: emailTemplates.subscriptionConfirmation(
        user.name,
        planName,
        duration,
      ),
    });
  } catch (error) {
    console.error("Error sending subscription email:", error);
  }
};

exports.sendPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Store reset token in user model (you'll need to add this field)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: emailTemplates.passwordReset(user.name, resetLink),
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
