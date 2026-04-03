const Controller = require("../controller/subscription.controller");
const planController = require("../controller/plan.cotroller");

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
router.post("/subscribe", protect, Controller.subscribePlan);
router.get("/my-subscription", protect, Controller.getMySubscription);
router.post(
  "/assign",
  protect,
  authorizeRoles("coach", "admin"),
  planController.assignPlanToClient,
);
// router.delete("/unsubscribe", protect, Controller.unsubscribe);
router.patch("/cancel/:id", protect, Controller.cancelSubscription);

module.exports = router;
