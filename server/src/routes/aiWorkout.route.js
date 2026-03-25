const aiWorkoutController = require("../controller/aiWorkout.controller");
const express = require("express");
const router = express.Router();

router.post(
  "/ai-workout",
  // requireSubscription(["pro", "premium", "enterprise"]),
  aiWorkoutController.getAiWorkout,
);
module.exports = router;
