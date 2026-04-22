const workoutController = require("../controller/workout.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const cache = require("../middleware/cache.middleware");
const redisClient = require("../config/redis");
const express = require("express");
const router = express.Router();
const { ROLES } = require("../constants/roles");

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
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  clearWorkoutCache,
  workoutController.createWorkout,
);

router.get(
  "/",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  cache("/workouts"),
  workoutController.getAllWorkouts,
);
router.get(
  "/analytics",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  workoutController.workoutAnalytics,
);
router.get(
  "/summary/progress",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  workoutController.getProgressSummary,
);

// Clear cache on update
router.put(
  "/:id",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  clearWorkoutCache,
  workoutController.updateWorkouts,
);

// Clear cache on delete
router.delete(
  "/:id",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  clearWorkoutCache,
  workoutController.deleteWorkout,
);

router.get(
  "/summary/daily",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  workoutController.dailySummary,
);
router.get(
  "/summary/weekly",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  workoutController.weeklySummary,
);
router.get(
  "/generate-weekly-plan",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  workoutController.generateWeeklyWorkout,
);
router.post(
  "/complete-exercise",
  protect,
  authorizeRoles(ROLES.USER, ROLES.COACH, ROLES.ADMIN),
  workoutController.completeExercise,
);
module.exports = router;
