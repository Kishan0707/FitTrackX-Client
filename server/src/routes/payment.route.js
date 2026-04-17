// const express = require("express");
// const router = express.Router();

// const paymentController = require("../controller/payment.controller");
// const { protect } = require("../middleware/auth.middleware");

// router.post("/create-order", protect, paymentController.createOrder);

// router.post("/verify-payment", protect, paymentController.verifyPayment);

// module.exports = router;
const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payment.controller");
const { protect } = require("../middleware/auth.middleware");

// checkout
router.post("/checkout", protect, paymentController.createProductCheckout);
router.post("/plan-checkout", protect, paymentController.createPlanCheckout);
// ⚠️ IMPORTANT (raw body)
// ❗ NO express.json() here
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // 🔥 IMPORTANT
  paymentController.stripeWebhook,
);

module.exports = router;
