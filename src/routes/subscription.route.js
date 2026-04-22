const Controller = require("../controller/subscription.controller");
const planController = require("../controller/plan.controller");

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.post(
  "/subscribe",
  protect,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  Controller.subscribePlan,
);
router.get(
  "/my-subscription",
  protect,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  Controller.getMySubscription,
);
router.post(
  "/assign",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.assignPlanToClient,
);
// router.delete("/unsubscribe", protect, Controller.unsubscribe);
router.patch(
  "/cancel/:id",
  protect,
  authorizeRoles(ROLES.USER, ROLES.ADMIN),
  Controller.cancelSubscription,
);

module.exports = router;
