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

// Progress Tracking
router.get(
  "/patients/:id/progress",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPatientProgress,
);
router.post(
  "/patients/:id/progress/entry",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.addProgressEntry,
);
router.post(
  "/patients/:id/progress/photo",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.addProgressPhoto,
);
router.put(
  "/patients/:id/progress/goals",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updatePatientGoals,
);
router.post(
  "/patients/:id/progress/note",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.addDoctorNote,
);
router.get(
  "/patients/:id/progress/analytics",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getProgressAnalytics,
);
router.put(
  "/patients/:id/progress/status",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updateProgressStatus,
);
router.get(
  "/progress/summary",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getProgressSummary,
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
router.post(
  "/schedule",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.createSchedule,
);
router.put(
  "/schedule/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.updateSchedule,
);
router.delete(
  "/schedule/:id",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.deleteSchedule,
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


// ==================== DOCTOR CHAT ROUTES ====================

// Send message to patient
router.post(
  "/chat/:patientId",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.sendMessageToPatient,
);

// Get conversation with a specific patient
router.get(
  "/chat/:patientId",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getPatientConversation,
);

// Get all patient conversations (with last message and unread count)
router.get(
  "/chat/conversations",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.getAllConversations,
);

// Mark messages from patient as seen
router.patch(
  "/chat/:patientId/seen",
  protect,
  authorizeRoles(ROLES.DOCTOR),
  doctorController.markMessagesAsSeen,
);

module.exports = router;

// ==================== PUBLIC ROUTES ====================

// List all doctors (public)
router.get("/public/list", doctorController.listDoctors);

// Get single doctor public profile
router.get("/public/:id", doctorController.getDoctorProfilePublic);
