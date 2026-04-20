const express = require("express");
const router = express.Router();

const coachController = require("../controller/coach.controller.js");
const planController = require("../controller/plan.controller.js");
const workoutTemplateController = require("../controller/workoutTemplate.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.get(
  "/dashboard",
  protect,
  authorizeRoles("coach"),
  coachController.dashboardStats,
);
router.get("/my-request", protect, coachController.getMyCoachRequest);
router.get(
  "/pending-requests",
  protect,
  authorizeRoles("coach"),
  coachController.getPendingRequests,
);
router.patch(
  "/respond-request",
  protect,
  authorizeRoles("coach"),
  coachController.respondToRequest,
);
router.get("/clients", protect, coachController.getMyCoach);
router.get(
  "/plans",
  protect,
  authorizeRoles("coach", "admin"),
  planController.getAllPlans,
);
router.post("/request", protect, coachController.requestCoach);

router.post(
  "/plans",
  protect,
  authorizeRoles("coach", "admin"),
  planController.createPlans,
);
router.post(
  "/assign-member",
  protect,
  authorizeRoles("coach"),
  coachController.assignMember,
);
router.post(
  "/plans/assign",
  protect,
  authorizeRoles("coach", "admin"),
  planController.assignPlanToClient,
);
router.post("/assign-workout", protect, coachController.assignWorkout);
router.post(
  "/workout-templates",
  protect,
  authorizeRoles("coach"),
  workoutTemplateController.createTemplate,
);
router.get("/workout-templates", protect, workoutTemplateController.getTemplates);
router.delete(
  "/workout-templates/:id",
  protect,
  authorizeRoles("coach"),
  workoutTemplateController.deleteTemplate,
);

router.put(
  "/plans/:id",
  protect,
  authorizeRoles("coach", "admin"),
  planController.updatePlan,
);
router.delete(
  "/plans/:id",
  protect,
  authorizeRoles("coach", "admin"),
  planController.deletePlan,
);
router.get(
  "/client-detail/:userId",
  protect,
  authorizeRoles("coach"),
  coachController.clientDetail,
);
router.get(
  "/report",
  protect,
  authorizeRoles("coach"),
  coachController.coachReport,
);
router.get("/client-progress/:userId", protect, coachController.clientProgress);
router.get("/my-workouts", protect, coachController.getMyAssignedWorkouts);

router.get("/member", protect, coachController.getMembers);
router.delete("/members/:memberId", protect, coachController.removeMember);
router.delete(
  "/workout/:id",
  protect,
  authorizeRoles("coach", "admin"),
  coachController.deletedWorkout,
);
router.get(
  "/workouts",
  protect,
  authorizeRoles("coach", "admin"),
  coachController.getCoachWorkouts,
);

router.patch("/workout/:id/complete", protect, coachController.completeWorkout);
router.put(
  "/workout/:id",
  protect,
  authorizeRoles("coach", "admin"),
  coachController.updateWorkout,
);
module.exports = router;
