const express = require("express");
const router = express.Router();

const sellerController = require("../controller/seller.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.get(
  "/products",
  protect,
  authorizeRoles(ROLES.SELLER, ROLES.ADMIN),
  sellerController.getMyProducts,
);
router.get(
  "/orders",
  protect,
  authorizeRoles(ROLES.SELLER, ROLES.ADMIN),
  sellerController.getSellerOrders,
);
router.get(
  "/stats",
  protect,
  authorizeRoles(ROLES.SELLER, ROLES.ADMIN),
  sellerController.getSellerStats,
);

module.exports = router;
