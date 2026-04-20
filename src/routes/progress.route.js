const express = require("express");
const router = express.Router();
const controller = require("../controller/progress.controller");
const { protect } = require("../middleware/auth.middleware");
router.get("/graphs", protect, controller.progress);
router.get("/monthly-comparison", protect, controller.monthlyComparision);
module.exports = router;
