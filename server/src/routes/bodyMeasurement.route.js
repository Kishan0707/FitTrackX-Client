const express = require("express");
const router = express.Router();

const controller = require("../controller/bodyMeasurement.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, controller.createBodyMeasurement);

router.get("/", protect, controller.getAllBodyMeasurements);

router.get("/latest", protect, controller.getLatestBodyMeasurement);

router.put("/:id", protect, controller.updateBodyMeasurement);

router.delete("/:id", protect, controller.deleteBodyMeasurement);
router.get("/weight-history", protect, controller.getMeasurementHHistory);

module.exports = router;
