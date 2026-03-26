const express = require("express");
const adminController = require("../controller/admin.controller");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.minddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.get("/dashboard", protect, adminOnly, adminController.dashBoardStats);
router.get(
  "/users",
  protect,
  adminOnly,
  authorizeRoles("admin"),
  adminController.allUsers,
);
router.post(
  "/users/bulk-action",
  protect,
  adminOnly,
  authorizeRoles("admin"),
  adminController.bulkUserAction,
);
router.get(
  "/users/:id/moderation",
  protect,
  adminOnly,
  authorizeRoles("admin"),
  adminController.getUserModeration,
);
router.put(
  "/users/:id/moderation",
  protect,
  adminOnly,
  authorizeRoles("admin"),
  adminController.updateUserModeration,
);
router.patch(
  "/users/:id/moderation",
  protect,
  adminOnly,
  authorizeRoles("admin"),
  adminController.updateUserModeration,
);
router.delete("/users/:id", protect, adminOnly, adminController.deleteUsers);
router.get(
  "/audit-logs",
  protect,
  adminOnly,
  authorizeRoles("admin"),
  adminController.getAdminAuditLogs,
);
router.get("/workouts", protect, adminOnly, adminController.getAllWorkout);
router.delete(
  "/workouts/:id",
  protect,
  adminOnly,
  adminController.deleteWorkout,
);
router.get(
  "/user-growth",
  protect,
  adminOnly,
  adminController.getUserGrowthChart,
);
router.get(
  "/workout-distribution",
  protect,
  adminOnly,
  adminController.getWorkoutDistribution,
);
router.get("/diets", protect, adminOnly, adminController.getAllDiets);
router.post("/diets", protect, adminOnly, adminController.createDiet);
router.put("/diets/:id", protect, adminOnly, adminController.updateDiet);
router.delete("/diets/:id", protect, adminOnly, adminController.deleteDiet);
router.get(
  "/reports/user-activity",
  protect,
  adminOnly,
  adminController.getUserActivityReport,
);
router.get(
  "/reports/workout",
  protect,
  adminOnly,
  adminController.getWorkoutReport,
);
router.get(
  "/reports/diet-adherence",
  protect,
  adminOnly,
  adminController.getDietAdherenceReport,
);
router.get(
  "/reports/revenue",
  protect,
  adminOnly,
  adminController.getRevenueReport,
);
router.get(
  "/recent-activities",
  protect,
  adminOnly,
  adminController.getRecentActivities,
);
router.get(
  "/top-performers",
  protect,
  adminOnly,
  adminController.getTopPerformers,
);
router.get(
  "/system-health",
  protect,
  adminOnly,
  adminController.getSystemHealth,
);

// Coach Management Routes
router.get("/coaches", protect, adminOnly, adminController.getAllCoaches);
router.post("/coaches", protect, adminOnly, adminController.createCoach);
router.put("/coaches/:id", protect, adminOnly, adminController.updateCoach);
router.delete("/coaches/:id", protect, adminOnly, adminController.deleteCoach);
router.get("/coaches/:id", protect, adminOnly, adminController.getCoachDetails);
router.get(
  "/coaches/:id/clients",
  protect,
  adminOnly,
  adminController.getCoachClients,
);
router.post(
  "/coaches/:id/assign-client",
  protect,
  adminOnly,
  adminController.assignClientToCoach,
);
router.post(
  "/coaches/:id/unassign-client",
  protect,
  adminOnly,
  adminController.unassignClientFromCoach,
);

module.exports = router;
