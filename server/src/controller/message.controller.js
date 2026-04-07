const Message = require("../models/message.model");
const { getIO } = require("../config/socket");

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const msg = await Message.create({
      sender: req.user._id,
      receiverId,
      message,
      seen: false,
    });
    const populatedMessage = await msg.populate("sender", "name email");

    getIO().to(receiverId.toString()).emit("receiveMessage", populatedMessage);

    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
