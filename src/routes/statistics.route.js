const express = require("express");
const router = express.Router();
const statisticsController = require("../controller/statistics.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const cache = require("../middleware/cache.middleware");
const { ROLES } = require("../constants/roles");

router.get(
  "/",
  protect,
  cache("statistics"),
  authorizeRoles(ROLES.ADMIN, ROLES.COACH, ROLES.USER),
  statisticsController.getStatistics,
);

module.exports = router;
