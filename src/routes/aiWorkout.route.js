const aiWorkoutController = require("../controller/aiWorkout.controller");
const { protect } = require("../middleware/auth.middleware");
const { optionalProtect } = require("../middleware/optionalAuth.middleware");
const express = require("express");
const router = express.Router();

router.post(
  "/ai-workout",
  // requireSubscription(["pro", "premium", "enterprise"]),
  optionalProtect,
  aiWorkoutController.getAiWorkout,
);

router.post(
  "/complete-exercise",
  protect,
  aiWorkoutController.completeExercise,
);
module.exports = router;
