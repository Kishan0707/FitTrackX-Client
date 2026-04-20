const express = require("express");
const router = express.Router();
const productController = require("../controller/product.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.get("/", protect, productController.getProducts);
router.post("/", protect, productController.createProduct);
router.get(
  "/pending",
  protect,
  authorizeRoles("admin"),
  productController.getPendingProducts,
);
router.get("/:id", protect, productController.getSingleProduct);
router.patch(
  "/:id/verify",
  protect,
  authorizeRoles("admin"),
  productController.verifyProduct,
);
router.patch(
  "/:id/reject",
  protect,
  authorizeRoles("admin"),
  productController.rejectProduct,
);

module.exports = router;
