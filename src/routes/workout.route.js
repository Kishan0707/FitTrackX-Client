const workoutController = require("../controller/workout.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const cache = require("../middleware/cache.middleware");
const redisClient = require("../config/redis");
const express = require("express");
const router = express.Router();

// Middleware to clear cache
const clearWorkoutCache = async (req, res, next) => {
  try {
    if (redisClient && typeof redisClient.del === "function") {
      const userId = req.user?._id || req.user?.id;
      const cacheKey = `/workouts:${userId || "anonymous"}`;
      await redisClient.del(cacheKey);
      console.log("Cache cleared for key:", cacheKey);
    }
  } catch (err) {
    console.error("Error clearing cache:", err);
  }
  next();
};

// Clear cache on create
router.post(
  "/",
  protect,
  authorizeRoles("user", "coach", "admin"),
  clearWorkoutCache,
  workoutController.createWorkout,
);

router.get("/", protect, cache("/workouts"), workoutController.getAllWorkouts);
router.get("/analytics", protect, workoutController.workoutAnalytics);
router.get("/summary/progress", protect, workoutController.getProgressSummary);

// Clear cache on update
router.put(
  "/:id",
  protect,
  clearWorkoutCache,
  workoutController.updateWorkouts,
);

// Clear cache on delete
router.delete(
  "/:id",
  protect,
  clearWorkoutCache,
  workoutController.deleteWorkout,
);

router.get("/summary/daily", protect, workoutController.dailySummary);
router.get("/summary/weekly", protect, workoutController.weeklySummary);
router.get(
  "/generate-weekly-plan",
  protect,
  workoutController.generateWeeklyWorkout,
);
router.post("/complete-exercise", protect, workoutController.completeExercise);
module.exports = router;
