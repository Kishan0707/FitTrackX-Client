const Razorpay = require("razorpay");
const crypto = require("crypto");
// const Razorpay = require('../config/razorpay');
const Subscription = require("../models/subscription.model");
const { Plan } = require("../models/plan.model");
// const instance = new razorpay({})

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id; // Concatenate order ID and payment ID to create the string to be hashed
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // Use the same secret key used to create the order
      .update(body) // Update the HMAC object with the concatenated string
      .digest("hex"); // Generate the expected signature using HMAC SHA256
    if (expectedSignature !== razorpay_signature) {
      return res.status(402).json({
        success: false,
        message: "Payment verification failed",
      });
    }
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);
    const subscription = await Subscription.create({
      userId: req.user._id,
      planId: planId,
      startDate: new Date(),
      endDate: endDate,
      plan: plan.title,
      price: plan.price,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      status: "active",
      amount: plan.price,
    });

    res.status(200).json({
      success: true,
      subscription: subscription,
      message: "Payment verified successfully",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      plan: plan.title,
    });
  } catch (err) {
    console.error("Error in createOrder:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    console.log("Received planId:", planId);

    const plan = await Plan.findById(planId); // FIX
    console.log("Found plan:", plan);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const options = {
      amount: plan.price * 100,
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };
    console.log("Options:", options);

    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("Razorpay instance created");

    const order = await razorpayInstance.orders.create(options);
    console.log("Order created:", order);

    res.status(200).json({
      success: true,
      data: plan,
      order,
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
