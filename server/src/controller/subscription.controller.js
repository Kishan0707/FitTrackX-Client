const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: plan.title,
            },
            unit_amount: plan.price * 100,
          },
          quantity: 1,
        },
      ],

      metadata: {
        planId: plan._id.toString(),
        userId: req.user._id.toString(),
      },

      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({
      success: true,
      sessionId: session.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getMySubscription = async (req, res) => {
  try {
    const user = await require("../models/user.model")
      .findById(req.user._id)
      .select("goal");

    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: { $in: ["active", "expired"] },
    }).populate({
      path: "planId",
      populate: {
        path: "coachId",
        select: "name email",
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // 🔥 Auto-expire logic
    if (
      subscription.endDate < new Date() &&
      subscription.status !== "expired"
    ) {
      subscription.status = "expired";
      await subscription.save();
    }

    res.status(200).json({
      success: true,
      data: {
        ...subscription.toObject(),
        userGoal: user?.goal,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
