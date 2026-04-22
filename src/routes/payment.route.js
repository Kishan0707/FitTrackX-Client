const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payment.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ALL_ROLES } = require("../constants/roles");

// checkout
router.post(
  "/checkout",
  protect,
  authorizeRoles(...ALL_ROLES),
  paymentController.createProductCheckout,
);
router.post(
  "/plan-checkout",
  protect,
  authorizeRoles(...ALL_ROLES),
  paymentController.createPlanCheckout,
);
router.get(
  "/confirm",
  protect,
  authorizeRoles(...ALL_ROLES),
  paymentController.confirmCheckoutSession,
);
router.get(
  "/status",
  protect,
  authorizeRoles(...ALL_ROLES),
  paymentController.getPaymentStatus,
);

// webhook route requires raw body
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook,
);

// orders
router.get(
  "/my-orders",
  protect,
  authorizeRoles(...ALL_ROLES),
  paymentController.getMyOrders,
);

module.exports = router;
