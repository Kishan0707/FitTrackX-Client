// Middleware to check if user has an active subscription
const Subscription = require("../models/subscription.model");

exports.requireSubscription = (plans) => {
  return async (req, res, next) => {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
      // plan: { $in: ["pro", "enterprise"] },
      plan: { $in: plans },
      endDate: { $gt: new Date() },
    });
    if (!subscription) {
      console.log("Premium Subscription required");
      return res.status(402).json({ error: "Premium ubscription required" });
    }
    req.subscription = subscription; // Attach subscription info to request
    next();
  };
};
