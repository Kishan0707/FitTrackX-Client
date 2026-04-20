const Steps = require("../models/steps.model");
const User = require("../models/user.model");

// Coach assigns step target to a client
exports.assignStepTarget = async (req, res) => {
  try {
    const { clientId, goal } = req.body;

    const client = await User.findOne({
      _id: clientId,
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    });
    if (!client)
      return res.status(404).json({ success: false, message: "Client not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // upsert today's record for this client
    await Steps.findOneAndUpdate(
      { userId: clientId, date: { $gte: today } },
      { coachId: req.user._id, goal, goalStatus: "pending", steps: 0 },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Step target assigned" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Client responds to step target (accept/reject)
exports.respondStepTarget = async (req, res) => {
  try {
    const { action } = req.body; // "accepted" | "rejected"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Steps.findOne({
      userId: req.user._id,
      goalStatus: "pending",
      date: { $gte: today },
    });

    if (!record)
      return res.status(404).json({ success: false, message: "No pending target found" });

    record.goalStatus = action;
    await record.save();

    res.status(200).json({ success: true, message: `Target ${action}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Client logs their steps
exports.logSteps = async (req, res) => {
  try {
    const { steps } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Steps.findOneAndUpdate(
      { userId: req.user._id, date: { $gte: today } },
      { steps },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Client gets their own step records
exports.getMySteps = async (req, res) => {
  try {
    const records = await Steps.find({ userId: req.user._id }).sort({ date: -1 }).limit(30);
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Client gets pending step target
exports.getPendingTarget = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await Steps.findOne({
      userId: req.user._id,
      goalStatus: "pending",
      date: { $gte: today },
    }).populate("coachId", "name");
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Coach gets all step records for a client
exports.getClientSteps = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await User.findOne({
      _id: clientId,
      $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
    });
    if (!client)
      return res.status(404).json({ success: false, message: "Client not found" });

    const records = await Steps.find({ userId: clientId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
