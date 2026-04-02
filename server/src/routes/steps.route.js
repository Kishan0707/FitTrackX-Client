const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const {
  assignStepTarget,
  respondStepTarget,
  logSteps,
  getMySteps,
  getPendingTarget,
  getClientSteps,
} = require("../controller/steps.controller");

router.use(protect);

router.post("/assign", authorizeRoles("coach"), assignStepTarget);
router.get("/client/:clientId", authorizeRoles("coach"), getClientSteps);
router.post("/respond", respondStepTarget);
router.post("/log", logSteps);
router.get("/my", getMySteps);
router.get("/pending-target", getPendingTarget);

module.exports = router;
