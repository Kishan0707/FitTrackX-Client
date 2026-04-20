const express = require("express");
const router = express.Router();
const coachActivityController = require("../controller/coachActivity.controller");
const { protect } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/admin.minddleware");

// Coach Activity Routes
router.get(
  "/coaches/:id/activity",
  protect,
  adminOnly,
  coachActivityController.getCoachActivity,
);

router.get(
  "/coaches/:id/activity/stats",
  protect,
  adminOnly,
  coachActivityController.getActivityStats,
);

// Client Progress Routes
router.get(
  "/coaches/:id/clients-progress",
  protect,
  adminOnly,
  coachActivityController.getAllClientsProgress,
);

router.get(
  "/coaches/:id/clients/:clientId/progress",
  protect,
  adminOnly,
  coachActivityController.getClientProgress,
);

router.post(
  "/coaches/:id/clients/:clientId/progress",
  protect,
  adminOnly,
  coachActivityController.createClientProgress,
);

router.post(
  "/coaches/:id/clients/:clientId/progress/update",
  protect,
  adminOnly,
  coachActivityController.addProgressUpdate,
);

router.post(
  "/coaches/:id/clients/:clientId/progress/achievement",
  protect,
  adminOnly,
  coachActivityController.addAchievement,
);

router.put(
  "/coaches/:id/clients/:clientId/progress/goals",
  protect,
  adminOnly,
  coachActivityController.updateGoals,
);

module.exports = router;
