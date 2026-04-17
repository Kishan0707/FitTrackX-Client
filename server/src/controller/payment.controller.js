const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// // const Razorpay = require('../config/razorpay');
// const Subscription = require("../models/subscription.model");
// const { Plan } = require("../models/plan.model");
// // const instance = new razorpay({})

// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       planId,
//     } = req.body;
//     const body = razorpay_order_id + "|" + razorpay_payment_id; // Concatenate order ID and payment ID to create the string to be hashed
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // Use the same secret key used to create the order
//       .update(body) // Update the HMAC object with the concatenated string
//       .digest("hex"); // Generate the expected signature using HMAC SHA256
//     if (expectedSignature !== razorpay_signature) {
//       return res.status(402).json({
//         success: false,
//         message: "Payment verification failed",
//       });
//     }
//     const plan = await Plan.findById(planId);
//     if (!plan) {
//       res.status(404).json({
//         success: false,
//         message: "Plan not found",
//       });
//     }
//     const endDate = new Date();
//     endDate.setDate(endDate.getDate() + plan.duration);
//     const subscription = await Subscription.create({
//       userId: req.user._id,
//       planId: planId,
//       startDate: new Date(),
//       endDate: endDate,
//       plan: plan.title,
//       price: plan.price,
//       paymentId: razorpay_payment_id,
//       orderId: razorpay_order_id,
//       signature: razorpay_signature,
//       status: "active",
//       amount: plan.price,
//     });

//     res.status(200).json({
//       success: true,
//       subscription: subscription,
//       message: "Payment verified successfully",
//       orderId: razorpay_order_id,
//       paymentId: razorpay_payment_id,
//       signature: razorpay_signature,
//       plan: plan.title,
//     });
//   } catch (err) {
//     console.error("Error in createOrder:", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

// exports.createOrder = async (req, res) => {
//   try {
//     const { planId } = req.body;
//     console.log("Received planId:", planId);

//     const plan = await Plan.findById(planId); // FIX
//     console.log("Found plan:", plan);

//     if (!plan) {
//       return res.status(404).json({
//         success: false,
//         message: "Plan not found",
//       });
//     }

//     const options = {
//       amount: plan.price * 100,
//       currency: "INR",
//       receipt: "receipt_order_" + Date.now(),
//     };
//     console.log("Options:", options);

//     const razorpayInstance = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });
//     console.log("Razorpay instance created");

//     const order = await razorpayInstance.orders.create(options);
//     console.log("Order created:", order);

//     res.status(200).json({
//       success: true,
//       data: plan,
//       order,
//     });
//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: err.message,
//     });
//   }
// };

//

const Product = require("../models/product.model");
const Order = require("../models/order.model");
const { Plan } = require("../models/plan.model");
const Subscription = require("../models/subscription.model");

// =====================================================
// 🔥 PRODUCT CHECKOUT (Ecommerce)
// =====================================================
exports.createProductCheckout = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
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

      success_url: `${process.env.CLIENT_URL}/success?type=product`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.log("Product Checkout Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// 🔥 PLAN CHECKOUT (Subscription)
// =====================================================
exports.createPlanCheckout = async (req, res) => {
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
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        planId: plan._id.toString(),
        userId: req.user._id.toString(),
      },

      success_url: `${process.env.CLIENT_URL}/success?type=plan`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.log("Plan Checkout Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// 🔥 STRIPE WEBHOOK (MAIN ENGINE)
// =====================================================
exports.stripeWebhook = async (req, res) => {
  let event;

  try {
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
