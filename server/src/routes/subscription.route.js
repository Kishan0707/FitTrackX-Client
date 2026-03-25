const Controller = require("../controller/subscription.controller");

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
router.post("/subscribe", protect, Controller.subscribePlan);
router.get("/my-subscription", protect, Controller.getMySubscription);
// router.delete("/unsubscribe", protect, Controller.unsubscribe);
router.patch("/cancel/:id", protect, Controller.cancelSubscription);

module.exports = router;
