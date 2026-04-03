const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
exports.subscribePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);
    const subscription = await Subscription.create({
      userId: req.user._id,
      planId,
      plan: plan.title,
      startDate: new Date(),
      endDate,
      price: plan.price,
      amount: plan.price,
      status: "active",
    });
    if (subscription.endDate < new Date()) {
      subscription.status = "expired";
      await subscription.save();
    }
    res.status(200).json({
      success: true,
      message: "Subscription successfully purches",
      data: subscription,
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
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    }).populate("planId");
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }
    res.status(200).json({
      success: true,
      data: subscription,
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

exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: "active" },
      {
        status: "cancelled",
      },
      {
        new: true,
      },
    );
    if (!subscription) {
      res.status(400).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
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
