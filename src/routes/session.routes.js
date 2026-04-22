const sessionController = require("../controller/coach.controller");
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.use(protect);

router.post(
  "/",
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  sessionController.createSessions,
);
router.get(
  "/my-sessions",
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  sessionController.getSessions,
);
router.get(
  "/client-sessions",
  authorizeRoles(ROLES.USER),
  sessionController.getClientSessions,
);
router.patch(
  "/:id/respond",
  authorizeRoles(ROLES.USER),
  sessionController.respondSession,
);
router.patch(
  "/:id",
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  sessionController.updateSession,
);
router.delete(
  "/:id",
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  sessionController.deleteSessions,
);

module.exports = router;
