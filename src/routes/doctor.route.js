const express = require("express");
const router = express.Router();

const doctorController = require("../controller/doctor.controller.js");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

// ==================== DOCTOR-ONLY ROUTES ====================

// Dashboard & Overview
router.get(
  "/dashboard",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getDashboardStats,
);

// Patient Management
router.get(
  "/patients",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPatients,
);
router.get(
  "/patients/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPatientDetails,
);
router.get(
  "/patients/:id/history",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPatientMedicalHistory,
);
router.get(
  "/patients/analytics",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPatientAnalytics,
);
router.post(
  "/patients",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.createPatient,
);
router.delete(
  "/patients/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.removePatient,
);
// Appointments
router.get(
  "/appointments",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getAppointments,
);
router.get(
  "/appointments/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getAppointment,
);
router.post(
  "/appointments",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.createAppointment,
);
router.put(
  "/appointments/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updateAppointment,
);
router.delete(
  "/appointments/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.cancelAppointment,
);
router.put(
  "/appointments/bulk-status",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.bulkUpdateAppointmentStatus,
);

// Prescriptions
router.get(
  "/prescriptions",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPrescriptions,
);
router.get(
  "/prescriptions/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPrescription,
);
router.post(
  "/prescriptions",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.createPrescription,
);
router.put(
  "/prescriptions/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updatePrescription,
);

// Lab Reports
router.get(
  "/reports",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getReports,
);
router.post(
  "/reports",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.uploadReport,
);
router.put(
  "/reports/:id/status",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updateReportStatus,
);
router.delete(
  "/reports/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.deleteReport,
);
router.get(
  "/reports/summary/appointments",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getAppointmentSummary,
);

// Video Consultation
router.post(
  "/video-consult/start",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.startVideoConsult,
);
router.post(
  "/video-consult/:appointmentId/end",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.endVideoConsult,
);
router.get(
  "/video-consult/history",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getVideoConsultHistory,
);

// Schedule
router.get(
  "/schedule",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getSchedule,
);

// Earnings & Settings
router.get(
  "/earnings",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getEarnings,
);
router.get(
  "/settings/consultation-fee",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getConsultationFee,
);
router.put(
  "/settings/consultation-fee",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.setConsultationFee,
);
router.put(
  "/availability",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.toggleAvailability,
);

// Profile
router.get(
  "/profile",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getProfile,
);
router.put(
  "/profile",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updateProfile,
);

module.exports = router;

// ==================== PUBLIC ROUTES ====================

// List all doctors (public)
router.get("/public/list", doctorController.listDoctors);

// Get single doctor public profile
router.get("/public/:id", doctorController.getDoctorProfilePublic);
