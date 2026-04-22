const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");
const {
  assignStepTarget,
  respondStepTarget,
  logSteps,
  getMySteps,
  getPendingTarget,
  getClientSteps,
} = require("../controller/steps.controller");

router.use(protect);

router.post("/assign", authorizeRoles(ROLES.COACH), assignStepTarget);
router.get("/client/:clientId", authorizeRoles(ROLES.COACH), getClientSteps);
router.post("/respond", authorizeRoles(ROLES.USER), respondStepTarget);
router.post("/log", authorizeRoles(ROLES.USER), logSteps);
router.get("/my", authorizeRoles(ROLES.USER), getMySteps);
router.get("/pending-target", authorizeRoles(ROLES.USER), getPendingTarget);

module.exports = router;
