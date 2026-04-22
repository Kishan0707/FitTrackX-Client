const express = require("express");
const router = express.Router();

const coachController = require("../controller/coach.controller.js");
const planController = require("../controller/plan.controller.js");
const workoutTemplateController = require("../controller/workoutTemplate.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.get(
  "/dashboard",
  protect,
  authorizeRoles(ROLES.COACH),
  coachController.dashboardStats,
);
router.get(
  "/my-request",
  protect,
  authorizeRoles(ROLES.USER),
  coachController.getMyCoachRequest,
);
router.get(
  "/pending-requests",
  protect,
  authorizeRoles(ROLES.COACH),
  coachController.getPendingRequests,
);
router.patch(
  "/respond-request",
  protect,
  authorizeRoles(ROLES.COACH),
  coachController.respondToRequest,
);
router.get(
  "/clients",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.getMyCoach,
);
router.get(
  "/plans",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.getAllPlans,
);
router.post(
  "/request",
  protect,
  authorizeRoles(ROLES.USER),
  coachController.requestCoach,
);

router.post(
  "/plans",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.createPlans,
);
router.post(
  "/assign-member",
  protect,
  authorizeRoles(ROLES.COACH),
  coachController.assignMember,
);
router.post(
  "/plans/assign",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.assignPlanToClient,
);
router.post(
  "/assign-workout",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.assignWorkout,
);
router.post(
  "/workout-templates",
  protect,
  authorizeRoles(ROLES.COACH),
  workoutTemplateController.createTemplate,
);
router.get(
  "/workout-templates",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  workoutTemplateController.getTemplates,
);
router.delete(
  "/workout-templates/:id",
  protect,
  authorizeRoles(ROLES.COACH),
  workoutTemplateController.deleteTemplate,
);

router.put(
  "/plans/:id",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.updatePlan,
);
router.delete(
  "/plans/:id",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  planController.deletePlan,
);
router.get(
  "/client-detail/:userId",
  protect,
  authorizeRoles(ROLES.COACH),
  coachController.clientDetail,
);
router.get(
  "/report",
  protect,
  authorizeRoles(ROLES.COACH),
  coachController.coachReport,
);
router.get(
  "/client-progress/:userId",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.clientProgress,
);
router.get(
  "/my-workouts",
  protect,
  authorizeRoles(ROLES.USER),
  coachController.getMyAssignedWorkouts,
);

router.get(
  "/member",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.getMembers,
);
router.delete(
  "/members/:memberId",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.removeMember,
);
router.delete(
  "/workout/:id",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.deletedWorkout,
);
router.get(
  "/workouts",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.getCoachWorkouts,
);

router.patch(
  "/workout/:id/complete",
  protect,
  authorizeRoles(ROLES.USER),
  coachController.completeWorkout,
);
router.put(
  "/workout/:id",
  protect,
  authorizeRoles(ROLES.COACH, ROLES.ADMIN),
  coachController.updateWorkout,
);
module.exports = router;
