const sessionController = require("../controller/coach.controller");
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.use(protect, authorizeRoles("coach", "admin"));

router.post("/", sessionController.createSessions);
router.get("/my-sessions", sessionController.getSessions);
router.delete("/:id", sessionController.deleteSessions);

module.exports = router;