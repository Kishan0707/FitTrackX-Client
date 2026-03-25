const workoutController = require("../controller/workout.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const cache = require("../middleware/cache.middleware");
const express = require("express");
const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("user"),
  workoutController.createWorkout,
);
router.get("/", protect, cache("/workouts"), workoutController.getAllWorkouts);
router.put("/:id", protect, workoutController.updateWorkouts);
router.delete("/:id", protect, workoutController.deleteWorkout);
router.get("/summary/daily", protect, workoutController.dailySummary);
router.get("/summary/weekly", protect, workoutController.weeklySummary);
router.get(
  "/generate-weekly-plan",
  protect,
  workoutController.generateWeeklyWorkout,
);

module.exports = router;
