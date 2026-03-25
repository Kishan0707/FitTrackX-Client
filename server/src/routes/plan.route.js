const express = require("express");

const router = express.Router();

const planController = require("../controller/plan.cotroller");
const { protect } = require("../middleware/auth.middleware");
router.post("/create", protect, planController.createPlans);
router.get("/my-plan", protect, planController.getAllPlans);
router.get("/", protect, planController.getAllPlansForUsers);
router.post("/subscribe", protect, planController.subscriptionPlan);
router.get("/subscribe/:planId", protect, planController.getSubscribers);
router.put("/update/:id", protect, planController.updatePlan);
router.delete("/delete/:id", protect, planController.deletePlan);
module.exports = router;
