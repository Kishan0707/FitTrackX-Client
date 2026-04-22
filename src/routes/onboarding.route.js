const express = require("express");
const router = express.Router();
const onboardingController = require("../controller/onboarding.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.post(
  "/complete",
  protect,
  authorizeRoles(ROLES.USER),
  onboardingController.completeOnboarding,
);

module.exports = router;
