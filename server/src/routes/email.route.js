const express = require("express");
const router = express.Router();
const emailController = require("../controller/email.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/workout-reminder", protect, emailController.sendWorkoutReminder);
router.post("/password-reset", emailController.sendPasswordResetEmail);

module.exports = router;
