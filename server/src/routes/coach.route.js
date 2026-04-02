const express = require("express");
const router = express.Router();

const coachController = require("../controller/coach.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.get(
  "/dashboard",
  protect,
  authorizeRoles("coach"),
  coachController.dashboardStats,
);
router.post("/request", protect, coachController.requestCoach);
router.get("/my-request", protect, coachController.getMyCoachRequest);
router.get("/pending-requests", protect, authorizeRoles("coach"), coachController.getPendingRequests);
router.patch("/respond-request", protect, authorizeRoles("coach"), coachController.respondToRequest);
router.get("/clients", protect, coachController.getMyCoach);
router.post("/assign-workout", protect, coachController.assignWorkout);
router.get("/client-detail/:userId", protect, authorizeRoles("coach"), coachController.clientDetail);
router.get("/client-progress/:userId", protect, coachController.clientProgress);
router.post(
  "/assign-member",
  protect,
  authorizeRoles("coach"),
  coachController.assignMember,
);
router.get("/member", protect, coachController.getMembers);
router.delete("/members/:memberId", protect, coachController.removeMember);
module.exports = router;
