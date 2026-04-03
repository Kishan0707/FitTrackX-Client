const sessionController = require("../controller/coach.controller");
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.use(protect);

router.post("/", authorizeRoles("coach", "admin"), sessionController.createSessions);
router.get("/my-sessions", authorizeRoles("coach", "admin"), sessionController.getSessions);
router.get("/client-sessions", sessionController.getClientSessions);
router.patch("/:id/respond", sessionController.respondSession);
router.delete("/:id", authorizeRoles("coach", "admin"), sessionController.deleteSessions);

module.exports = router;