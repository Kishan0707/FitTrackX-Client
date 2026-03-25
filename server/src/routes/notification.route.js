const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, notificationController.getNotifications);
router.put("/:id/read", protect, notificationController.markAsRead);
router.put("/read-all", protect, notificationController.markAllAsRead);
router.delete("/:id", protect, notificationController.deleteNotification);

module.exports = router;
