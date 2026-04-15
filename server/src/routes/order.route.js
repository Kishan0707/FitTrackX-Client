const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller");
const { protect } = require("../middleware/auth.middleware");

// create order
router.post("/", protect, orderController.createOrder);

// user orders
router.get("/my", protect, orderController.getMyOrder);

// seller orders
router.get("/seller", protect, orderController.getSellerOrders);

// update status
router.put("/:id", protect, orderController.updateOrderStatus);

module.exports = router;
