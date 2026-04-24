const express = require("express");
const router = express.Router();

const doctorController = require("../controller/doctor.controller");

// Public routes for doctor directory and profiles
router.get("/", doctorController.listDoctors);
router.get("/:id", doctorController.getDoctorProfilePublic);

module.exports = router;
