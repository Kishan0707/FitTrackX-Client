const express = require("express");
const router = express.Router();
const statisticsController = require("../controller/statistics.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const cache = require("../middleware/cache.middleware");

router.get(
  "/",
  protect,
  cache("statistics"),
  authorizeRoles("admin", "coach", "user"),
  statisticsController.getStatistics,
);

module.exports = router;
