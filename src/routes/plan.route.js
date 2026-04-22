const express = require("express");

const router = express.Router();

const planController = require("../controller/plan.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.post(
  "/create",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.createPlans,
);
router.get(
  "/my-plan",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.getAllPlans,
);
router.get("/", protect, planController.getAllPlansForUsers);
router.post("/subscribe", protect, planController.subscriptionPlan);
router.get(
  "/subscribe/:planId",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.getSubscribers,
);
router.put(
  "/update/:id",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.updatePlan,
);
router.delete(
  "/delete/:id",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.deletePlan,
);
module.exports = router;
