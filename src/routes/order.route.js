const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

// create order
router.post("/", protect, orderController.createOrder);

// user orders
router.get("/my", protect, orderController.getMyOrder);

// seller orders
router.get(
  "/seller",
  protect,
  authorizeRoles(ROLES.SELLER, ROLES.ADMIN),
  orderController.getSellerOrders,
);

// update status
router.put(
  "/:id",
  protect,
  authorizeRoles(ROLES.SELLER, ROLES.ADMIN),
  orderController.updateOrderStatus,
);
router.get("/:id", protect, orderController.getSingleOrder);

module.exports = router;
