const express = require("express");
const router = express.Router();
const productController = require("../controller/product.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.get("/", protect, productController.getProducts);
router.post(
  "/",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.SELLER, ROLES.ADMIN),
  productController.createProduct,
);
router.get(
  "/pending",
  protect,
  authorizeRoles(ROLES.ADMIN),
  productController.getPendingProducts,
);
router.get("/:id", protect, productController.getSingleProduct);
router.patch(
  "/:id/verify",
  protect,
  authorizeRoles(ROLES.ADMIN),
  productController.verifyProduct,
);
router.patch(
  "/:id/reject",
  protect,
  authorizeRoles(ROLES.ADMIN),
  productController.rejectProduct,
);

module.exports = router;
