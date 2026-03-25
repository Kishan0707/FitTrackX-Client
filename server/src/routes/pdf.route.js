const pdfController = require("../controller/pdf.controller");
const { protect } = require("../middleware/auth.middleware");
const express = require("express");
const router = express.Router();
router.get("/report", protect, pdfController.exportuserReport);
module.exports = router;
