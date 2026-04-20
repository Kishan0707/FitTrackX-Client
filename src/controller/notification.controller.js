const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { emitNotification } = require("../config/socket");
const {
  sendEmail,
  emailTemplates,
  isEmailConfigured,
} = require("../config/email");

const getNotificationSubject = (type, title) => {
  switch (type) {
    case "workout":
      return `Workout update: ${title}`;
    case "diet":
      return `Diet alert: ${title}`;
    case "goal":
      return `Goal milestone: ${title}`;
    case "subscription":
      return `Subscription notice: ${title}`;
    case "coach":
      return `Coach message: ${title}`;
    default:
      return `FitTrack notification: ${title}`;
  }
};

exports.createNotification = async (
  userId,
  type,
  title,
  message,
  link = null,
) => {
  try {
    const [notification, user] = await Promise.all([
      Notification.create({
        userId,
        type,
        title,
        message,
        link,
      }),
      User.findById(userId).select("name email"),
    ]);

    // Emit real-time notification
    emitNotification(userId.toString(), notification);

    if (user?.email && isEmailConfigured) {
      try {
        await sendEmail({
          to: user.email,
          subject: getNotificationSubject(type, title),
          html: emailTemplates.notificationAlert(
            user.name || "Friend",
            title,
            message,
          ),
        });
      } catch (emailErr) {
        console.error("Notification email failed:", emailErr);
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
