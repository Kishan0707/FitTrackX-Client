
const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");

const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return features.map((feature) => String(feature).trim()).filter(Boolean);
  }

  if (typeof features === "string") {
    return features
      .split(",")
      .map((feature) => feature.trim())
      .filter(Boolean);
  }

  return [];
};

const buildEndDate = (duration) => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(duration || 0));
  return endDate;
};

const upsertActiveSubscription = async ({
  userId,
  plan,
  status = "active",
}) => {
  await Subscription.updateMany(
    { userId, status: "active", planId: { $ne: plan._id } },
    { status: "cancelled" },
  );

  let subscription = await Subscription.findOne({
    userId,
    planId: plan._id,
    status: "active",
  });

  const subscriptionPayload = {
    userId,
    planId: plan._id,
    plan: plan.title,
    startDate: new Date(),
    endDate: buildEndDate(plan.duration),
    price: plan.price,
    amount: plan.price,
    status,
  };

  if (subscription) {
    Object.assign(subscription, subscriptionPayload);
    await subscription.save();
    return subscription;
  }

  subscription = await Subscription.create(subscriptionPayload);
  return subscription;
};

exports.createPlans = async (req, res) => {
  try {
    if (!["coach", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only coaches can create plans",
      });
    }

    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const price = Number(req.body.price);
    const duration = Number(req.body.duration);
    const features = normalizeFeatures(req.body.features);

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid plan price is required",
      });
    }

    if (!Number.isFinite(duration) || duration < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid plan duration is required",
      });
    }

    const newPlan = await Plan.create({
      coachId,
      title,
      description,
      price,
      duration,
      features,
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
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
    const plans = await Plan.find({ coachId: req.user._id }).sort({
      createdAt: -1,
    });

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
    const plans = await Plan.find({}).sort({ createdAt: -1 });

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
    if (plan.coachId.toString() !== req.user._id.toString()) {
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
    let plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Check if the coach trying to update the plan is the owner
    if (plan.coachId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this plan",
      });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      updates.title = String(req.body.title || "").trim();
    }

    if (req.body.description !== undefined) {
      updates.description = String(req.body.description || "").trim();
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Valid plan price is required",
        });
      }
      updates.price = price;
    }

    if (req.body.duration !== undefined) {
      const duration = Number(req.body.duration);
      if (!Number.isFinite(duration) || duration < 1) {
        return res.status(400).json({
          success: false,
          message: "Valid plan duration is required",
        });
      }
      updates.duration = duration;
    }

    if (req.body.features !== undefined) {
      updates.features = normalizeFeatures(req.body.features);
    }

    plan = await Plan.findByIdAndUpdate(req.params.id, updates, { new: true });

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
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const subscription = await upsertActiveSubscription({
      userId: req.user._id,
      plan,
    });

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
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

exports.getSubscribers = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      planId: req.params.planId,
      status: "active",
    })
      .populate("userId", "name email weight goal")
      .sort({ createdAt: -1 });

    const users = subscriptions
      .map((subscription) => subscription.userId)
      .filter(Boolean);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
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

exports.assignPlanToClient = async (req, res) => {
  try {
    const { planId, clientId, userId } = req.body;
    const targetUserId = clientId || userId;

    if (!planId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "planId and clientId are required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      plan.coachId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can assign only your own plans",
      });
    }

    const clientQuery =
      req.user.role === "admin" ?
        { _id: targetUserId, role: "user" }
      : {
          _id: targetUserId,
          role: "user",
          $or: [{ assignedCoach: req.user._id }, { coachId: req.user._id }],
        };

    const client = await User.findOne(clientQuery).select("_id name email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found for this coach",
      });
    }

    const subscription = await upsertActiveSubscription({
      userId: client._id,
      plan,
    });

    res.status(200).json({
      success: true,
      message: "Plan assigned successfully",
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
exports.stripeWebhook = async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log("Webhook error:", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const { planId, userId } = session.metadata;

    try {
      const plan = await Plan.findById(planId);

      if (!plan) return;

      // 🔥 CANCEL OLD SUBSCRIPTIONS
      await Subscription.updateMany(
        { userId, status: "active", planId: { $ne: plan._id } },
        { status: "cancelled" },
      );

      // 🔥 CREATE NEW SUBSCRIPTION
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      await Subscription.create({
        userId,
        planId: plan._id,
        plan: plan.title,
        startDate: new Date(),
        endDate,
        price: plan.price,
        amount: plan.price,
        status: "active",
      });

      console.log("✅ Subscription Activated");
    } catch (err) {
      console.log("Subscription error:", err);
    }
  }

  res.json({ received: true });
};
