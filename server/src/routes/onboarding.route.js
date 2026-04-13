const express = require("express");
const router = express.Router();
const onboardingController = require("../controller/onboarding.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/complete", protect, onboardingController.completeOnboarding);

module.exports = router;
