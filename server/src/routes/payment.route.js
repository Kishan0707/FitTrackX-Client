const express = require("express");
const router = express.Router();

const paymentController = require("../controller/payment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/create-order", protect, paymentController.createOrder);

router.post("/verify-payment", protect, paymentController.verifyPayment);

module.exports = router;
