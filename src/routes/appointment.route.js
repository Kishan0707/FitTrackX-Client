const express = require("express");
const router = express.Router();
const Appointment = require("../models/appointment.model");
const appointmentController = require("../controller/doctor.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

// Patient can book appointment
router.post(
  "/",
  protect,
  authorizeRoles(ROLES.USER),
  appointmentController.bookAppointment,
);
router.get("/appointment/:id", protect, async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (
    appointment.userId.toString() !== req.user._id &&
    appointment.doctorId.toString() !== req.user._id
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json(appointment);
});
module.exports = router;
