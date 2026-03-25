const express = require("express");
const healthController = require("../controller/health.controller");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

router.post("/bmi", protect, healthController.calculateBMI);
router.post("/calories", protect, healthController.calculateCalories);

module.exports = router;
