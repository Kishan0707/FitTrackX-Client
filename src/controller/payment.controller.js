const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const { getStripe } = require("../config/stripe");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const mongoose = require("mongoose");

const normalizeJsonBody = (body) => {
  if (!body) return {};
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      return {};
    }
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
};

// =====================================================
// 🔥 PRODUCT CHECKOUT (Ecommerce)
// =====================================================
exports.createProductCheckout = async (req, res) => {
  try {
    const stripe = getStripe();
    const body = normalizeJsonBody(req.body);
    const { productId } = body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required in JSON body",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productId",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if (
      !Number.isFinite(Number(product.finalPrice)) ||
      Number(product.finalPrice) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product price is invalid for checkout",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: product.name,
            },
            unit_amount: Math.round(product.finalPrice * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        productId: product._id.toString(),
        userId: req.user._id.toString(),
      },

      success_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/success?type=product`
        : `http://localhost:5173/success?type=product`,
      cancel_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/cancel`
        : `http://localhost:5173/cancel`,
    });
    console.log("CLIENT_URL:", process.env.CLIENT_URL);
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.log("Product Checkout Error:", err);
    res
      .status(err.statusCode || 500)
      .json({ success: false, error: err.message || "Checkout failed" });
  }
};

// =====================================================
// 🔥 PLAN CHECKOUT (Subscription)
// =====================================================
exports.createPlanCheckout = async (req, res) => {
  try {
    const stripe = getStripe();
    const body = normalizeJsonBody(req.body);
    const { planId } = body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required in JSON body",
      });
    }

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
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        planId: plan._id.toString(),
        userId: req.user._id.toString(),
      },

      success_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/success?type=plan`
        : `http://localhost:5173/success?type=plan`,
      cancel_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/cancel`
        : `http://localhost:5173/cancel`,
    });
    console.log("CLIENT_URL:", process.env.CLIENT_URL);
    console.log("FINAL URL:", `${process.env.CLIENT_URL}/success?type=plan`);
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.log("Plan Checkout Error:", err);
    res
      .status(err.statusCode || 500)
      .json({ success: false, error: err.message || "Plan checkout failed" });
  }
};

// =====================================================
// 🔥 STRIPE WEBHOOK (MAIN ENGINE)
// =====================================================
exports.stripeWebhook = async (req, res) => {
  let event;

  try {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body, // 🔥 raw buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log("❌ Webhook signature failed:", err.message);
    return res.sendStatus(400);
  }

  console.log("🔥 WEBHOOK VERIFIED");

  // rest logic...
};
