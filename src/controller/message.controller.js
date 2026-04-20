const Message = require("../models/message.model");
const User = require("../models/user.model");
const { getIO } = require("../config/socket");
const fs = require("fs");
const path = require("path");

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const msg = await Message.create({
      sender: req.user._id,
      receiverId,
      message,
      seen: false,
    });
    const populatedMessage = await msg.populate("sender", "name email profilePicture");

    getIO().to(receiverId.toString()).emit("receiveMessage", populatedMessage);

    logChatActivity({
      sender: req.user._id,
      receiverId,
      message,
      createdAt: msg.createdAt,
    });

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const logAttempt = (entry) => {
  const logDir = path.join(__dirname, "../../logs");
  const filePath = path.join(logDir, "chat-activity.log");
  const serialized = `${new Date().toISOString()} ${entry.sender} -> ${entry.receiverId}: ${entry.message}\n`;
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(filePath, serialized, "utf8");
};

const logChatActivity = (entry) => {
  try {
    logAttempt(entry);
  } catch (error) {
    console.error("Failed to log chat activity:", error);
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const me = req.user._id;
    const messages = await Message.find({
      $or: [{ sender: me }, { receiverId: me }],
    })
      .populate("sender", "name email")
      .sort("createdAt");
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: me, receiverId: userId },
        { sender: userId, receiverId: me },
      ],
    })
      .populate("sender", "name email")
      .sort("createdAt");

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markSeen = async (req, res) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      {
        sender: userId,
        receiverId: req.user._id,
        seen: false,
      },
      { seen: true },
    );
    getIO()
      .to(userId.toString())
      .emit("messagesSeen", { userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: me, receiverId: userId },
        { sender: userId, receiverId: me },
      ],
    })
      .populate("sender", "name email profilePicture")
      .sort("createdAt");

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="conversation-${me}-${userId}.json"`,
    );
    res.send(JSON.stringify({ exportedAt: new Date(), messages }));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const me = req.user._id;

    const sentCount = await Message.countDocuments({ sender: me });
    const receivedCount = await Message.countDocuments({ receiverId: me });

    const lastSent = await Message.findOne({ sender: me })
      .sort("-createdAt")
      .select("receiverId createdAt");
    const lastReceived = await Message.findOne({ receiverId: me })
      .sort("-createdAt")
      .select("sender createdAt");

    res.json({
      success: true,
      data: {
        sentCount,
        receivedCount,
        total: sentCount + receivedCount,
        lastSent,
        lastReceived,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
