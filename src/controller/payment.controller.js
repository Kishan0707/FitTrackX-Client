const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const { getStripe } = require("../config/stripe");
const Product = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const PaymentEvent = require("../models/paymentEvent.model");
const mongoose = require("mongoose");
const { ROLES, ALL_ROLES } = require("../constants/roles");
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

const persistCheckoutSession = async (session) => {
  const metadata = session?.metadata || {};
  const { type, productId, planId, userId } = metadata;

  if (!type || !userId) {
    throw new Error("Missing metadata: type or userId");
  }

  if (type === "product") {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found for id ${productId}`);
    }

    const basePrice = Number(product.originalPrice || product.finalPrice || 0);
    const gstAmount = Number(product.gstAmount || 0);
    const totalAmount = Number((basePrice + gstAmount).toFixed(2));

    await Order.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        $setOnInsert: {
          userId,
          productId,
          sellerId: product.sellerId || product.coach || null,
          price: basePrice,
          gstAmount,
          totalAmount,
          // legacy fields for existing readers
          gst: gstAmount,
          total: totalAmount,
          status: "confirmed",
          statusHistory: [{ status: "paid" }],
          stripeSessionId: session.id,
        },
      },
      { upsert: true, new: true },
    );

    return { savedType: "product" };
  }

  if (type === "plan") {
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error(`Plan not found for id ${planId}`);
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(plan.duration || 0));

    await Subscription.updateMany(
      { userId, status: "active", planId: { $ne: plan._id } },
      { status: "cancelled" },
    );

    await Subscription.findOneAndUpdate(
      { paymentId: String(session.payment_intent || session.id) },
      {
        $setOnInsert: {
          userId,
          planId,
          plan: plan.title,
          startDate: new Date(),
          endDate,
          price: plan.price,
          amount: plan.price,
          status: "active",
          paymentId: String(session.payment_intent || session.id),
          orderId: session.id,
        },
      },
      { upsert: true, new: true },
    );

    return { savedType: "plan" };
  }

  throw new Error(`Unsupported checkout type: ${type}`);
};

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
        type: "product",
        productId: product._id.toString(),
        userId: req.user._id.toString(),
      },
      success_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/success?type=product&session_id={CHECKOUT_SESSION_ID}`
        : "http://localhost:5173/success?type=product&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/cancel`
        : "http://localhost:5173/cancel",
    });

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
        type: "plan",
        planId: plan._id.toString(),
        userId: req.user._id.toString(),
      },
      success_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/success?type=plan&session_id={CHECKOUT_SESSION_ID}`
        : "http://localhost:5173/success?type=plan&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        process.env.CLIENT_URL ?
          `${process.env.CLIENT_URL}/cancel`
        : "http://localhost:5173/cancel",
    });

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

exports.stripeWebhook = async (req, res) => {
  let event;

  try {
    if (!endpointSecret) {
      console.error("Stripe webhook secret is missing in environment");
      return res.sendStatus(500);
    }

    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log("Webhook signature failed:", err.message);
    return res.sendStatus(400);
  }

  try {
    await PaymentEvent.findOneAndUpdate(
      { eventId: event.id },
      {
        $setOnInsert: {
          eventId: event.id,
          type: event.type,
          source: "webhook",
          status: "received",
        },
      },
      { upsert: true, new: true },
    );
  } catch (err) {
    console.error("Failed to record payment event:", err.message);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const result = await persistCheckoutSession(session);
      console.log(`Webhook save success: ${result.savedType}`);
      await PaymentEvent.updateOne(
        { eventId: event.id },
        {
          $set: {
            status: "processed",
            sessionId: session.id,
            userId: session?.metadata?.userId || null,
            details: { savedType: result.savedType },
            processedAt: new Date(),
          },
        },
      );
    } catch (err) {
      console.error("Webhook DB error:", err);
      await PaymentEvent.updateOne(
        { eventId: event.id },
        {
          $set: {
            status: "failed",
            errorMessage: err.message || "Unknown webhook error",
            sessionId: session?.id || null,
            userId: session?.metadata?.userId || null,
          },
        },
      );
    }
  } else {
    await PaymentEvent.updateOne(
      { eventId: event.id },
      {
        $set: {
          status: "ignored",
          details: { reason: "Unhandled event type" },
          processedAt: new Date(),
        },
      },
    );
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const { type, role } = session.metadata;

    if (type === "role") {
      console.log("✅ Role payment success:", role);

      // future:
      // save payment record / temp session
    }
  }
  res.status(200).json({ received: true });
};

exports.confirmCheckoutSession = async (req, res) => {
  try {
    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Checkout session is not paid",
      });
    }

    const sessionUserId = String(session?.metadata?.userId || "");
    if (!sessionUserId || sessionUserId !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Session does not belong to current user",
      });
    }

    const result = await persistCheckoutSession(session);

    await PaymentEvent.findOneAndUpdate(
      { eventId: `confirm:${session.id}` },
      {
        $set: {
          type: "checkout.session.completed",
          source: "confirm-endpoint",
          status: "processed",
          sessionId: session.id,
          userId: req.user._id,
          details: { savedType: result.savedType },
          processedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Checkout confirmed and persisted",
      data: { type: result.savedType, sessionId: session.id },
    });
  } catch (err) {
    console.error("confirmCheckoutSession error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to confirm checkout session",
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    const [order, subscription, confirmEvent] = await Promise.all([
      Order.findOne({ stripeSessionId: sessionId }).select(
        "_id status price gstAmount totalAmount createdAt",
      ),
      Subscription.findOne({ orderId: sessionId }).select(
        "_id status plan price startDate endDate createdAt",
      ),
      PaymentEvent.findOne({ eventId: `confirm:${sessionId}` }).select(
        "status errorMessage details processedAt",
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        persisted: Boolean(order || subscription),
        order,
        subscription,
        confirmEvent,
      },
    });
  } catch (err) {
    console.error("getPaymentStatus error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch payment status",
    });
  }
};

exports.createRoleCheckout = async (req, res) => {
  try {
    const stripe = getStripe();
    const { role } = req.body;
    let price = 0;
    if (role === ROLES.USER) price = 1999;
    else if (role === ROLES.SELLER || role === ROLES.AFFILIATE) price = 199;
    else return res.status(400).json({ message: "Invalid role" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${role} access`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],

      metadata: {
        type: "role",
        role,
      },

      success_url: `${process.env.CLIENT_URL}/success?type=plan&role=${role}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Checkout error" });
  }
};
