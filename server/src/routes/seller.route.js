const express = require("express");
const router = express.Router();

const sellerController = require("../controller/seller.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/products", protect, sellerController.getMyProducts);
router.get("/orders", protect, sellerController.getSellerOrders);
router.get("/stats", protect, sellerController.getSellerStats);

module.exports = router;
