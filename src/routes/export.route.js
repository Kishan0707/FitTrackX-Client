const express = require("express");
const router = express.Router();
const exportController = require("../controller/export.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/data", protect, exportController.exportUserData);
router.get("/data/csv", protect, exportController.exportUserDataCSV);

module.exports = router;
