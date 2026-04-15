const express = require("express");
const router = express.Router();

const cartController = require("../controller/cart.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, cartController.addToCart);
router.get("/", protect, cartController.getCart);
router.delete("/:productId", protect, cartController.removeFromCart);
module.exports = router;
