const { Plan } = require("../models/plan.model");
const User = require("../models/user.model");

exports.createPlans = async (req, res) => {
  try {
    const { title, description, price, duration } = req.body;

    const newPlan = await Plan.create({
      coachId: req.user.id,
      title,
      description,
      price,
      duration,
    });

    // await newPlan.save();
    res.status(200).json({
      success: true,
      data: newPlan,
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

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ coachId: req.user.id });

    res.status(200).json({
      success: true,
      data: plans,
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

exports.getAllPlansForUsers = async (req, res) => {
  try {
    const plans = await Plan.find({});

    res.status(200).json({
      success: true,
      data: plans,
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
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Check if the coach trying to delete the plan is the owner
    if (plan.coachId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this plan",
      });
    }

    await Plan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
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
exports.updatePlan = async (req, res) => {
  try {
    const { title, description, price, duration } = req.body;

    let plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Check if the coach trying to update the plan is the owner
    if (plan.coachId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this plan",
      });
    }

    plan = await Plan.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        price,
        duration,
      },
      { new: true },
    );

    res.status(200).json({
      success: true,
      data: plan,
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

exports.subscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const user = await User.findById(req.user.id);

    user.subscribedPlans = planId;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
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

exports.getSubscribers = async (req, res) => {
  try {
    const user = await User.find({ subscribedPlans: req.params.planId }).select(
      "name email weight goal",
    );

    res.status(200).json({
      success: true,
      count: user.length,
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
