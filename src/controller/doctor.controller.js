const mongoose = require("mongoose");
const Patient = require("../models/doctorPatient.model"); // 👈 ensure model exists
const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const Prescription = require("../models/prescription.model");
const Report = require("../models/report.model");
const Subscription = require("../models/subscription.model");
const DoctorPatient = require("../models/doctorPatient.model.js");
const DoctorPatientProgress = require("../models/doctorPatientProgress.model");
const RiskAssignment = require("../models/riskAssignment.model");
const Message = require("../models/message.model");
const DoctorSchedule = require("../models/doctorSchedule.model");
const {
  sendEmail,
  emailTemplates,
  isEmailConfigured,
} = require("../config/email");
const { getIO } = require("../config/socket");
const DOCTOR_SETTINGS = require("../constants/roles").DOCTOR_SETTINGS;

// Helper: Get doctor's patients (users who have appointments/prescriptions with this doctor)
const getDoctorPatients = async (doctorId) => {
  const distinctUserIds = new Set();
  //  manual added patients
  const manual = await DoctorPatient.find({ doctorId }).distinct("patientId");
  manual.forEach((id) => distinctUserIds.add(id));

  // existing logic
  const appointments = await Appointment.find({ doctorId }).distinct("userId");
  appointments.forEach((id) => distinctUserIds.add(id));

  const prescriptions = await Prescription.find({ doctorId }).distinct(
    "userId",
  );
  prescriptions.forEach((id) => distinctUserIds.add(id));

  const reports = await Report.find({ doctorId }).distinct("userId");
  reports.forEach((id) => distinctUserIds.add(id));

  return Array.from(distinctUserIds);
};

const isPatientAssociatedWithDoctor = async (doctorId, patientId) => {
  const associatedByLink = await DoctorPatient.exists({
    doctorId,
    patientId,
  });
  if (associatedByLink) return true;

  const associatedByAppointment = await Appointment.exists({
    doctorId,
    userId: patientId,
  });
  if (associatedByAppointment) return true;

  const associatedByPrescription = await Prescription.exists({
    doctorId,
    userId: patientId,
  });
  if (associatedByPrescription) return true;

  const associatedByReport = await Report.exists({
    doctorId,
    userId: patientId,
  });
  if (associatedByReport) return true;

  return false;
};

// @desc    Get doctor dashboard statistics
// @route   GET /api/doctor/dashboard
// @access  Private (Doctor only)
exports.getDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user._id;
    console.log("USER:", req.user);
    // Total patients (distinct users with appointments/prescriptions/reports)
    const patientIds = await getDoctorPatients(doctorId);
    const totalPatients = patientIds.length;

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppointments = await Appointment.countDocuments({
      doctorId,
      date: { $gte: today },
    });

    // Pending lab reports (status = "pending")
    const pendingReports = await Report.countDocuments({
      doctorId,
      status: "pending",
    });

    // Monthly earnings (subscriptions created in current month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarningsAggregation = await Subscription.aggregate([
      {
        $match: {
          doctorId: doctorId,
          status: "active",
          createdAt: { $gte: firstDayOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const monthlyEarnings =
      monthlyEarningsAggregation.length > 0 ?
        monthlyEarningsAggregation[0].total
      : 0;

    // Upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingAppointments = await Appointment.find({
      doctorId,
      date: { $gte: today, $lte: nextWeek },
      status: { $ne: "cancelled" },
    })
      .populate("userId", "name email")
      .sort({ date: 1 })
      .limit(5);

    // Monthly prescriptions count (for internal use, not sent to frontend)
    const monthlyPrescriptions = await Prescription.countDocuments({
      doctorId,
      createdAt: { $gte: firstDayOfMonth },
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        todayAppointments,
        pendingReports,
        monthlyEarnings,
        // Additional data (not used by current frontend but useful)
        upcomingAppointments,
        monthlyPrescriptions,
      },
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get all patients for a doctor
// @route   GET /api/doctor/patients
// @access  Private (Doctor only)
exports.getPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { page = 1, limit = 20, search } = req.query;

    const patientIds = await getDoctorPatients(doctorId);

    const filter = { _id: { $in: patientIds } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const patients = await User.find(filter)
      .select("name email age gender profilePicture")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: patients,
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { email } = req.body;

    // Find existing user
    const patient = await User.findOne({ email });

    if (!patient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check already linked
    const exists = await DoctorPatient.findOne({
      doctorId,
      patientId: patient._id,
    });

    if (exists) {
      return res.status(400).json({ message: "Patient already added" });
    }

    // Create relation
    await DoctorPatient.create({
      doctorId,
      patientId: patient._id,
    });

    res.json({
      success: true,
      message: "Patient added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Remove patient from doctor's list
// @route   DELETE /api/doctor/patients/:id
// @access  Private (Doctor only)
exports.removePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    const result = await DoctorPatient.findOneAndDelete({
      doctorId,
      patientId: id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Patient not found in your list",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient removed successfully",
    });
  } catch (error) {
    console.error("Remove patient error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single patient details with medical history
// @route   GET /api/doctor/patients/:id
// @access  Private (Doctor only)
exports.getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await User.findById(id).select(
      "name email age height weight gender goal specialization experience profilePicture",
    );

    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if this patient is associated with the doctor
    const isAssociated = await isPatientAssociatedWithDoctor(req.user._id, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient",
      });
    }

    // Get patient's medical history (appointments, prescriptions, reports)
    const appointments = await Appointment.find({
      doctorId: req.user._id,
      userId: id,
    }).sort({ date: -1 });

    const prescriptions = await Prescription.find({
      doctorId: req.user._id,
      userId: id,
    }).sort({ createdAt: -1 });

    const reports = await Report.find({
      doctorId: req.user._id,
      userId: id,
    }).sort({ createdAt: -1 });

    // Get body measurements
    const Bodymeasurements = require("../models/bodyMeasurement.model");
    const measurements = await Bodymeasurements.findOne({ userId: id });

    // Get workout progress
    const Progress = require("../models/progress.model");
    const progress = await Progress.find({ userId: id }).sort({
      date: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        patient,
        medicalHistory: {
          appointments,
          prescriptions,
          reports,
          measurements,
          progress,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/doctor/appointments
// @access  Private (Doctor only)
exports.getAppointments = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const doctorId = req.user._id;

    const filter = { doctorId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(filter)
      .populate("userId", "name email age profilePicture")
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/doctor/appointments/:id
// @access  Private (Doctor only)
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
    }).populate("userId", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Create appointment (by doctor for patient)
// @route   POST /api/doctor/appointments
// @access  Private (Doctor only)
exports.createAppointment = async (req, res) => {
  try {
    const { userId, date, notes, timeSlot, mode } = req.body;

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        message: "Please provide user ID and appointment date",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const appointment = await Appointment.create({
      userId,
      doctorId: req.user._id,
      date: new Date(date),
      timeSlot: timeSlot || null,
      mode: mode || "video",
      notes,
      status: "pending",
      paymentStatus: "paid",
      // 🔥 roomId = appointmentId
      roomId: new mongoose.Types.ObjectId().toString(),
    });

    // Optionally send email notification to patient
    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to: user.email,
          subject: "New Appointment Scheduled",
          html: emailTemplates.appointmentScheduled(
            user.name,
            req.user.name,
            new Date(date).toLocaleString(),
          ),
        });
      } catch (emailErr) {
        console.error("Failed to send appointment email:", emailErr.message);
      }
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    List all doctors (public)
// @route   GET /api/doctors
// @access  Public
exports.listDoctors = async (req, res) => {
  try {
    const { search, specialty, location, priceRange } = req.query;
    const { ROLES } = require("../constants/roles");
    const filter = { role: ROLES.DOCTOR };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }
    if (specialty) {
      filter.specialization = { $regex: specialty, $options: "i" };
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }
    if (priceRange) {
      if (priceRange === "0-500") {
        filter["doctorSettings.consultationFee"] = { $lte: 500 };
      } else if (priceRange === "500-1000") {
        filter["doctorSettings.consultationFee"] = { $gte: 500, $lte: 1000 };
      } else if (priceRange === "1000+") {
        filter["doctorSettings.consultationFee"] = { $gte: 1000 };
      }
    }

    const doctors = await User.find(filter)
      .select(
        "name specialization experience rating reviewCount location address phone email profilePicture doctorSettings bio qualifications services",
      )
      .lean();

    const formattedDoctors = doctors.map((doc) => ({
      _id: doc._id,
      name: doc.name,
      specialty: doc.specialization,
      experience: doc.experience,
      rating: doc.rating || 4.5,
      reviewCount: doc.reviewCount || 0,
      location: doc.location,
      photo: doc.profilePicture,
      consultationFee: doc.doctorSettings?.consultationFee || 500,
      bio: doc.bio,
      services: doc.services || [],
      qualifications: doc.qualifications || [],
    }));

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors,
    });
  } catch (error) {
    console.error("List doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single doctor public profile
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorProfilePublic = async (req, res) => {
  try {
    const { ROLES } = require("../constants/roles");
    const doctor = await User.findOne({
      _id: req.params.id,
      role: ROLES.DOCTOR,
    }).select(
      "name specialization experience rating reviewCount location address phone email profilePicture doctorSettings bio qualifications services",
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const formattedDoctor = {
      _id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating || 4.5,
      reviewCount: doctor.reviewCount || 0,
      location: doctor.location,
      phone: doctor.phone,
      email: doctor.email,
      address: doctor.address,
      photo: doctor.profilePicture,
      consultationFee: doctor.doctorSettings?.consultationFee || 500,
      about: doctor.bio,
      qualifications: doctor.qualifications || [],
      services: doctor.services || [],
    };

    res.status(200).json({
      success: true,
      data: formattedDoctor,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Book appointment (by patient/ user)
// @route   POST /api/appointments
// @access  Private (User only)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, mode, planType } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Please provide doctor ID, date, and time slot",
      });
    }

    // Verify doctor exists and is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Verify patient (logged-in user) exists
    const patient = await User.findById(req.user._id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Combine date and time into a single Date object
    const timeMap = {
      "09:00 AM": "09:00",
      "10:00 AM": "10:00",
      "11:00 AM": "11:00",
      "12:00 PM": "12:00",
      "02:00 PM": "14:00",
      "03:00 PM": "15:00",
      "04:00 PM": "16:00",
      "05:00 PM": "17:00",
    };
    const time24 = timeMap[time] || time;
    const appointmentDate = new Date(`${date}T${time24}:00`);

    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      date: appointmentDate,
      timeSlot: time,
      mode: mode || "video",
      planType: planType || "single",
      status: "pending",
    });

    // Notify doctor via email
    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to: doctor.email,
          subject: "New Appointment Booking",
          html: emailTemplates.appointmentScheduled(
            patient.name,
            doctor.name,
            `${new Date(date).toLocaleDateString()} at ${time}`,
          ),
        });
      } catch (emailErr) {
        console.error("Failed to send booking email:", emailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Update appointment status/date
// @route   PUT /api/doctor/appointments/:id
// @access  Private (Doctor only)
exports.updateAppointment = async (req, res) => {
  try {
    const { date, status, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (date) appointment.date = new Date(date);
    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment updated",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/doctor/appointments/:id
// @access  Private (Doctor only)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctorId: req.user._id,
      },
      { status: "cancelled" },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Create prescription for patient
// @route   POST /api/doctor/prescriptions
// @access  Private (Doctor only)
exports.createPrescription = async (req, res) => {
  try {
    const patientId = req.body.userId || req.body.patientId;
    const { medicines, notes, isEmergency } = req.body;

    if (!patientId || !medicines || !Array.isArray(medicines)) {
      return res.status(400).json({
        success: false,
        message: "Please provide user ID and medicines array",
      });
    }

    // Verify user exists
    const user = await User.findById(patientId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Verify association with doctor
    const isAssociated = await isPatientAssociatedWithDoctor(
      req.user._id,
      patientId,
    );

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to prescribe this patient",
      });
    }

    const prescription = await Prescription.create({
      userId: patientId,
      doctorId: req.user._id,
      medicines,
      notes: notes || "",
      isEmergency: isEmergency || false,
    });

    // Send notification/email if emergency
    if (isEmergency && isEmailConfigured()) {
      try {
        await sendEmail({
          to: user.email,
          subject: "🚨 Emergency Prescription",
          html: emailTemplates.emergencyPrescription(
            user.name,
            req.user.name,
            medicines.join(", "),
          ),
        });
      } catch (emailErr) {
        console.error(
          "Failed to send emergency prescription email:",
          emailErr.message,
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update prescription
// @route   PUT /api/doctor/prescriptions/:id
// @access  Private (Doctor only)
exports.updatePrescription = async (req, res) => {
  try {
    const { medicines, notes, isEmergency } = req.body;

    const prescription = await Prescription.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (medicines) prescription.medicines = medicines;
    if (notes !== undefined) prescription.notes = notes;
    if (isEmergency !== undefined) prescription.isEmergency = isEmergency;

    await prescription.save();

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get doctor's prescriptions
// @route   GET /api/doctor/prescriptions
// @access  Private (Doctor only)
exports.getPrescriptions = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const doctorId = req.user._id;

    const filter = { doctorId };

    if (userId) {
      filter.userId = userId;
    }

    const skip = (page - 1) * limit;

    const prescriptions = await Prescription.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/doctor/prescriptions/:id
// @access  Private (Doctor only)
exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
    }).populate("userId", "name email age");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Upload lab report for patient
// @route   POST /api/doctor/reports
// @access  Private (Doctor only)
exports.uploadReport = async (req, res) => {
  try {
    const { userId, type, file } = req.body;

    if (!userId || !type || !file) {
      return res.status(400).json({
        success: false,
        message: "Please provide userId, report type, and file",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Note: Actual file upload handling would integrate with Cloudinary/S3
    // For now, we accept file URL
    const report = await Report.create({
      userId,
      doctorId: req.user._id,
      type,
      fileUrl: file,
      status: "pending", // default status for new reports
    });

    res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get doctor's reports
// @route   GET /api/doctor/reports
// @access  Private (Doctor only)
exports.getReports = async (req, res) => {
  try {
    const { userId, type, status, page = 1, limit = 20 } = req.query;
    const doctorId = req.user._id;

    const filter = { doctorId };
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const reports = await Report.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/doctor/reports/:id
// @access  Private (Doctor only)
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({
      _id: req.params.id,
      doctorId: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get doctor's earnings
// @route   GET /api/doctor/earnings
// @access  Private (Doctor only)
exports.getEarnings = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // All subscriptions where this doctor is the assigned doctor
    const subscriptions = await Subscription.find({
      doctorId,
      status: "active",
    });

    const totalEarnings = subscriptions.reduce((sum, sub) => {
      return sum + (sub.amount || 0);
    }, 0);

    // Earnings breakdown by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentEarnings = await Subscription.aggregate([
      {
        $match: {
          doctorId: doctorId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        recentEarnings,
        activeSubscriptions: subscriptions.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Set consultation fee
// @route   PUT /api/doctor/settings/consultation-fee
// @access  Private (Doctor only)
exports.setConsultationFee = async (req, res) => {
  try {
    const { feeType, amount } = req.body;

    if (!feeType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide feeType and amount",
      });
    }

    if (!DOCTOR_SETTINGS.PLAN_TYPES.includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee type",
      });
    }

    // Update user's doctor settings (could be stored in user document or separate collection)
    const doctor = await User.findById(req.user._id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    if (!doctor.doctorSettings) {
      doctor.doctorSettings = {};
    }

    doctor.doctorSettings.consultationFee = amount;
    doctor.doctorSettings.feeType = feeType;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Consultation fee updated",
      data: doctor.doctorSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Toggle doctor availability
// @route   PUT /api/doctor/availability
// @access  Private (Doctor only)
exports.toggleAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const doctor = await User.findById(req.user._id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    doctor.isAvailable =
      isAvailable !== undefined ? isAvailable : !doctor.isAvailable;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Doctor is now ${doctor.isAvailable ? "available" : "unavailable"}`,
      data: { isAvailable: doctor.isAvailable },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Initiate video consultation
// @route   POST /api/doctor/video-consult/start
// @access  Private (Doctor only)
exports.startVideoConsult = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: req.user._id,
      status: { $in: ["pending", "confirmed"] },
    }).populate("userId", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or already completed",
      });
    }

    // Generate a unique room ID for video call (could integrate with third-party service)
    const roomId = `consult-${appointment._id}-${Date.now()}`;
    const videoLink = `${process.env.VIDEO_CONSULT_BASE_URL || "https://meet.jit.si"}/${roomId}`;

    // Update appointment with video link and status
    appointment.videoLink = videoLink;
    appointment.status = "in_progress";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Video consultation started",
      data: {
        appointmentId: appointment._id,
        roomId,
        videoLink,
        patient: appointment.userId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    End video consultation
// @route   POST /api/doctor/video-consult/:appointmentId/end
// @access  Private (Doctor only)
exports.endVideoConsult = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.appointmentId,
        doctorId: req.user._id,
      },
      { status: "completed", endedAt: new Date() },
      { new: true },
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Consultation ended",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get video consultation history
// @route   GET /api/doctor/video-consult/history
// @access  Private (Doctor only)
exports.getVideoConsultHistory = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const filter = {
      doctorId,
      status: "completed",
      videoLink: { $exists: true },
    };

    const skip = (page - 1) * limit;

    const consultations = await Appointment.find(filter)
      .populate("userId", "name email profilePicture")
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: consultations.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: consultations,
    });
  } catch (error) {
    console.error("Video consult history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get doctor profile
// @route   GET /api/doctor/profile
// @access  Private (Doctor only)
exports.getProfile = async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select(
      "name email phone specialization experience bio profilePicture isAvailable doctorSettings",
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get stats summary
    const doctorId = req.user._id;
    const patientIds = await getDoctorPatients(doctorId);
    const totalPatients = patientIds.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppointments = await Appointment.countDocuments({
      doctorId,
      date: { $gte: today },
    });

    res.status(200).json({
      success: true,
      data: {
        profile: doctor,
        stats: {
          totalPatients,
          todayAppointments,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctor/profile
// @access  Private (Doctor only)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, specialization, experience, bio, profilePicture } =
      req.body;

    const doctor = await User.findById(req.user._id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (specialization !== undefined) doctor.specialization = specialization;
    if (experience !== undefined) doctor.experience = experience;
    if (bio !== undefined) doctor.bio = bio;
    if (profilePicture) doctor.profilePicture = profilePicture;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get patient medical history summary
// @route   GET /api/doctor/patients/:id/history
// @access  Private (Doctor only)
exports.getPatientMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify patient exists and is associated with doctor
    const isAssociated = await isPatientAssociatedWithDoctor(req.user._id, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient's history",
      });
    }

    const [
      appointments,
      prescriptions,
      reports,
      bodyMeasurements,
      progressRecords,
      steps,
      diets,
    ] = await Promise.all([
      Appointment.find({ doctorId: req.user._id, userId: id }).sort({
        date: -1,
      }),
      Prescription.find({ doctorId: req.user._id, userId: id }).sort({
        createdAt: -1,
      }),
      Report.find({ doctorId: req.user._id, userId: id }).sort({
        createdAt: -1,
      }),
      require("../models/bodyMeasurement.model").findOne({ userId: id }),
      require("../models/progress.model")
        .find({ userId: id })
        .sort({ date: -1 })
        .limit(10),
      require("../models/diet.model")
        .find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(10),
      require("../models/steps.model")
        .find({ userId: id })
        .sort({ date: -1 })
        .limit(30),
    ]);

    const patient = await User.findById(id).select(
      "name age gender height weight goal",
    );

    res.status(200).json({
      success: true,
      data: {
        patient,
        history: {
          appointments,
          prescriptions,
          reports,
          bodyMeasurements,
          progressRecords,
          steps,
          diets,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Bulk update appointment statuses
// @route   PUT /api/doctor/appointments/bulk-status
// @access  Private (Doctor only)
exports.bulkUpdateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentIds, status } = req.body;

    if (!appointmentIds || !Array.isArray(appointmentIds) || !status) {
      return res.status(400).json({
        success: false,
        message: "Please provide appointmentIds array and status",
      });
    }

    const result = await Appointment.updateMany(
      {
        _id: { $in: appointmentIds },
        doctorId: req.user._id,
      },
      { status },
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} appointments updated`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Assign risk level to patient
// @route   POST /api/doctor/patients/:id/risk-assignment
// @access  Private (Doctor only)
exports.assignRiskLevel = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user._id;
    const { riskLevel, notes } = req.body;

    if (!riskLevel || !["low", "medium", "high"].includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid risk level (low, medium, high)",
      });
    }

    // Verify patient exists and is a user
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if patient is associated with doctor
    const isAssociated = await Appointment.findOne({
      doctorId,
      userId: patientId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to assign risk level to this patient",
      });
    }

    // Check if risk assignment already exists for this patient-doctor pair
    let riskAssignment = await RiskAssignment.findOne({
      patientId,
      doctorId,
    });

    if (riskAssignment) {
      // Update existing assignment
      riskAssignment.riskLevel = riskLevel;
      riskAssignment.notes = notes || "";
      riskAssignment.assignedAt = new Date();
      await riskAssignment.save();
    } else {
      // Create new risk assignment
      riskAssignment = await RiskAssignment.create({
        patientId,
        doctorId,
        riskLevel,
        notes: notes || "",
      });
    }

    res.status(201).json({
      success: true,
      message: "Risk level assigned successfully",
      data: riskAssignment,
    });
  } catch (error) {
    console.error("Assign risk level error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Get risk assignment for patient
// @route   GET /api/doctor/patients/:id/risk-assignment
// @access  Private (Doctor only)
exports.getRiskAssignment = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user._id;

    // Verify patient exists and is a user
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if patient is associated with doctor
    const isAssociated = await Appointment.findOne({
      doctorId,
      userId: patientId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view risk assignment for this patient",
      });
    }

    const riskAssignment = await RiskAssignment.findOne({
      patientId,
      doctorId,
    });

    if (!riskAssignment) {
      return res.status(404).json({
        success: false,
        message: "No risk assignment found for this patient",
      });
    }

    res.status(200).json({
      success: true,
      data: riskAssignment,
    });
  } catch (error) {
    console.error("Get risk assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update risk assignment for patient
// @route   PUT /api/doctor/patients/:id/risk-assignment
// @access  Private (Doctor only)
exports.updateRiskAssignment = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user._id;
    const { riskLevel, notes } = req.body;

    if (!riskLevel || !["low", "medium", "high"].includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid risk level (low, medium, high)",
      });
    }

    // Verify patient exists and is a user
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if patient is associated with doctor
    const isAssociated = await Appointment.findOne({
      doctorId,
      userId: patientId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update risk assignment for this patient",
      });
    }

    const riskAssignment = await RiskAssignment.findOneAndUpdate(
      {
        patientId,
        doctorId,
      },
      {
        riskLevel,
        notes: notes || "",
        assignedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!riskAssignment) {
      return res.status(404).json({
        success: false,
        message: "Risk assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Risk assignment updated successfully",
      data: riskAssignment,
    });
  } catch (error) {
    console.error("Update risk assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Delete risk assignment for patient
// @route   DELETE /api/doctor/patients/:id/risk-assignment
// @access  Private (Doctor only)
exports.deleteRiskAssignment = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const doctorId = req.user._id;

    // Verify patient exists and is a user
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if patient is associated with doctor
    const isAssociated = await Appointment.findOne({
      doctorId,
      userId: patientId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete risk assignment for this patient",
      });
    }

    const riskAssignment = await RiskAssignment.findOneAndDelete({
      patientId,
      doctorId,
    });

    if (!riskAssignment) {
      return res.status(404).json({
        success: false,
        message: "Risk assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Risk assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete risk assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get all patients with their risk levels for a doctor
// @route   GET /api/doctor/patients/risk-levels
// @access  Private (Doctor only)
exports.getPatientsWithRiskLevels = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { page = 1, limit = 20, search, riskLevel } = req.query;

    // Get doctor's patients
    const patientIds = await getDoctorPatients(doctorId);

    const filter = { _id: { $in: patientIds } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "riskassignments",
          let: { patientId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$patientId", "$$patientId"] },
                    { $eq: ["$doctorId", mongoose.Types.ObjectId(doctorId)] },
                  ],
                },
              },
            },
          ],
          as: "riskAssignment",
        },
      },
      {
        $addFields: {
          riskLevel: { $arrayElemAt: ["$riskAssignment.riskLevel", 0] },
          riskNotes: { $arrayElemAt: ["$riskAssignment.notes", 0] },
          riskAssignedAt: { $arrayElemAt: ["$riskAssignment.assignedAt", 0] },
        },
      },
    ];

    // Add risk level filter if specified
    if (riskLevel && ["low", "medium", "high"].includes(riskLevel)) {
      pipeline.push({
        $match: { riskLevel },
      });
    }

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          password: 0,
          __v: 0,
          refreshToken: 0,
          resetPasswordToken: 0,
          resetPasswordExpire: 0,
        },
      },
    );

    // Get total count for pagination
    const countPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "riskassignments",
          let: { patientId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$patientId", "$$patientId"] },
                    { $eq: ["$doctorId", mongoose.Types.ObjectId(doctorId)] },
                  ],
                },
              },
            },
          ],
          as: "riskAssignment",
        },
      },
      {
        $addFields: {
          riskLevel: { $arrayElemAt: ["$riskAssignment.riskLevel", 0] },
        },
      },
    ];

    if (riskLevel && ["low", "medium", "high"].includes(riskLevel)) {
      countPipeline.push({
        $match: { riskLevel },
      });
    }

    countPipeline.push({ $count: "total" });

    const [patients, totalResult] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(countPipeline),
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: patients,
    });
  } catch (error) {
    console.error("Get patients with risk levels error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get consultation fee settings
// @route   GET /api/doctor/settings/consultation-fee
// @access  Private (Doctor only)
exports.getConsultationFee = async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select("doctorSettings");

    res.status(200).json({
      success: true,
      data: doctor.doctorSettings || {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Generate appointment summary report
// @route   GET /api/doctor/reports/appointment-summary
// @access  Private (Doctor only)
exports.getAppointmentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const doctorId = req.user._id;

    const filter = { doctorId };
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const appointments = await Appointment.find(filter);
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter(
      (a) => a.status === "confirmed",
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled",
    ).length;

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        completionRate:
          total > 0 ? ((completed / total) * 100).toFixed(2) + "%" : "0%",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get patient growth analytics
// @route   GET /api/doctor/analytics/patients
// @access  Private (Doctor only)
exports.getPatientAnalytics = async (req, res) => {
  try {
    const { period = "6months" } = req.query;
    const months = parseInt(period);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get first appointment date per patient
    const pipeline = [
      {
        $match: {
          doctorId: mongoose.Types.ObjectId(req.user._id),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          patients: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          month: "$_id",
          count: { $size: "$patients" },
        },
      },
      { $sort: { month: 1 } },
    ];

    const aggregation = await Appointment.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: aggregation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get doctor's schedule/calendar view
// @route   GET /api/doctor/schedule
// @access  Private (Doctor only)
exports.getSchedule = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { startDate, endDate } = req.query;

    const filter = { doctorId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to next 30 days
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 30);

      filter.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .populate("userId", "name email profilePicture phone")
      .sort({ date: 1 })
      .lean();

    // Group by date
    const schedule = appointments.reduce((acc, apt) => {
      const dateStr = new Date(apt.date).toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(apt);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        schedule,
        totalAppointments: appointments.length,
      },
    });
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update report status (mark as reviewed)
// @route   PUT /api/doctor/reports/:id/status
// @access  Private (Doctor only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["pending", "reviewed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status required (pending, reviewed, cancelled)",
      });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        doctorId: req.user._id,
      },
      { status },
      { new: true },
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report status updated",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== PROGRESS TRACKING ====================

// @desc    Get patient progress tracking data
// @route   GET /api/doctor/patients/:id/progress
// @access  Private (Doctor only)
exports.getPatientProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    // Verify patient exists and is associated with doctor
    const patient = await User.findById(id);
    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const isAssociated = await isPatientAssociatedWithDoctor(doctorId, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient's progress",
      });
    }

    // Get or create progress tracking record
    let progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    });

    // If no record exists, create one with initial stats
    if (!progressRecord) {
      const bodyMeasurements = require("../models/bodyMeasurement.model");
      const initialMeasurements = await bodyMeasurements.findOne({
        userId: id,
      });

      progressRecord = await DoctorPatientProgress.create({
        patientId: id,
        doctorId,
        programType: "general_health",
        initialStats:
          initialMeasurements ?
            {
              weight: initialMeasurements.weight,
              bodyFat: initialMeasurements.bodyFat,
              measurements: {
                chest: initialMeasurements.chest,
                waist: initialMeasurements.waist,
                hips: initialMeasurements.hips,
                arms: initialMeasurements.arms,
                thighs: initialMeasurements.thighs,
                forearms: initialMeasurements.forearms,
                biceps: initialMeasurements.biceps,
              },
            }
          : {},
        currentStats:
          initialMeasurements ?
            {
              weight: initialMeasurements.weight,
              bodyFat: initialMeasurements.bodyFat,
              measurements: {
                chest: initialMeasurements.chest,
                waist: initialMeasurements.waist,
                hips: initialMeasurements.hips,
                arms: initialMeasurements.arms,
                thighs: initialMeasurements.thighs,
              },
            }
          : {},
      });
    }

    // Populate references
    await progressRecord.populate(
      "patientId",
      "name email age gender height profilePicture",
    );
    await progressRecord.populate(
      "doctorId",
      "name specialization profilePicture",
    );

    res.status(200).json({
      success: true,
      data: progressRecord,
    });
  } catch (error) {
    console.error("Get patient progress error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// @desc    Add progress entry (measurements, weight, notes)
// @route   POST /api/doctor/patients/:id/progress/entry
// @access  Private (Doctor only)
exports.addProgressEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const {
      weight,
      bodyFat,
      measurements,
      notes,
      doctorNotes,
      symptoms,
      vitals,
      dietAdherence,
      exerciseAdherence,
      overallScore,
    } = req.body;

    // Verify association
    const isAssociated = await isPatientAssociatedWithDoctor(doctorId, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this patient's progress",
      });
    }

    // Find or create progress record
    let progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    });

    if (!progressRecord) {
      progressRecord = await DoctorPatientProgress.create({
        patientId: id,
        doctorId,
        currentStats: {},
      });
    }

    // Build entry data
    const entryData = { date: new Date() };
    if (weight !== undefined) entryData.weight = weight;
    if (bodyFat !== undefined) entryData.bodyFat = bodyFat;
    if (measurements) entryData.measurements = measurements;
    if (notes) entryData.notes = notes;
    if (doctorNotes) entryData.doctorNotes = doctorNotes;
    if (symptoms) entryData.symptoms = symptoms;
    if (vitals) entryData.vitals = vitals;
    if (dietAdherence !== undefined) entryData.dietAdherence = dietAdherence;
    if (exerciseAdherence !== undefined)
      entryData.exerciseAdherence = exerciseAdherence;
    if (overallScore !== undefined) entryData.overallScore = overallScore;

    // Add entry to progress data
    progressRecord.progressData.push(entryData);

    // Update current stats
    if (weight !== undefined) progressRecord.currentStats.weight = weight;
    if (bodyFat !== undefined) progressRecord.currentStats.bodyFat = bodyFat;
    if (measurements) {
      progressRecord.currentStats.measurements = {
        ...progressRecord.currentStats.measurements,
        ...measurements,
      };
    }

    // Update last reviewed
    progressRecord.lastReviewed = {
      date: new Date(),
      doctorId,
    };

    await progressRecord.save();

    // Emit real-time update via socket
    const getIO = require("../config/socket").getIO;
    try {
      const io = getIO();
      io.to(`patient_${id}`).emit("progressUpdate", {
        patientId: id,
        doctorId,
        entry: entryData,
        progressPercentage: progressRecord.calculateWeightProgress(),
      });
    } catch (socketErr) {
      console.log("Socket not available:", socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Progress entry added",
      data: progressRecord,
    });
  } catch (error) {
    console.error("Add progress entry error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Upload/add progress photo
// @route   POST /api/doctor/patients/:id/progress/photo
// @access  Private (Doctor only)
exports.addProgressPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const { photoUrl, caption, date } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: "Photo URL is required",
      });
    }

    // Verify association
    const isAssociated = await isPatientAssociatedWithDoctor(doctorId, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this patient's progress",
      });
    }

    // Get or create progress record
    let progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    });

    if (!progressRecord) {
      progressRecord = await DoctorPatientProgress.create({
        patientId: id,
        doctorId,
      });
    }

    // Add photo to latest entry or create new entry
    const latestEntry =
      progressRecord.progressData[progressRecord.progressData.length - 1];
    if (latestEntry) {
      latestEntry.photos = latestEntry.photos || [];
      latestEntry.photos.push(photoUrl);
    } else {
      progressRecord.progressData.push({
        date: date ? new Date(date) : new Date(),
        photos: [photoUrl],
      });
    }

    // Also add to separate ProgressPhoto collection for gallery view
    const ProgressPhoto = require("../models/progressPhoto.model");
    await ProgressPhoto.create({
      userId: id,
      photo: photoUrl,
      date: date ? new Date(date) : new Date(),
    });

    await progressRecord.save();

    res.status(201).json({
      success: true,
      message: "Progress photo added",
      data: progressRecord,
    });
  } catch (error) {
    console.error("Add progress photo error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Update patient goals and targets
// @route   PUT /api/doctor/patients/:id/progress/goals
// @access  Private (Doctor only)
exports.updatePatientGoals = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const {
      targetWeight,
      targetBodyFat,
      targetMeasurements,
      deadline,
      description,
      weeklyTarget,
      programType,
      medicalCondition,
    } = req.body;

    // Verify association
    const isAssociated = await isPatientAssociatedWithDoctor(doctorId, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this patient's goals",
      });
    }

    const progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    });

    if (!progressRecord) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found. Create an entry first.",
      });
    }

    // Update goals
    if (targetWeight !== undefined)
      progressRecord.goals.targetWeight = targetWeight;
    if (targetBodyFat !== undefined)
      progressRecord.goals.targetBodyFat = targetBodyFat;
    if (targetMeasurements)
      progressRecord.goals.targetMeasurements = {
        ...progressRecord.goals.targetMeasurements,
        ...targetMeasurements,
      };
    if (deadline) progressRecord.goals.deadline = deadline;
    if (description !== undefined)
      progressRecord.goals.description = description;
    if (weeklyTarget !== undefined)
      progressRecord.goals.weeklyTarget = weeklyTarget;
    if (programType) progressRecord.programType = programType;
    if (medicalCondition) progressRecord.medicalCondition = medicalCondition;

    await progressRecord.save();

    // Emit socket event
    const getIO = require("../config/socket").getIO;
    try {
      const io = getIO();
      io.to(`patient_${id}`).emit("goalsUpdated", {
        patientId: id,
        doctorId,
        goals: progressRecord.goals,
      });
    } catch (socketErr) {}

    res.status(200).json({
      success: true,
      message: "Patient goals updated",
      data: progressRecord,
    });
  } catch (error) {
    console.error("Update patient goals error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Add doctor clinical note to patient progress
// @route   POST /api/doctor/patients/:id/progress/note
// @access  Private (Doctor only)
exports.addDoctorNote = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._doctorId || req.user._id;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    // Verify association
    const isAssociated = await isPatientAssociatedWithDoctor(doctorId, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    });

    if (!progressRecord) {
      progressRecord = await DoctorPatientProgress.create({
        patientId: id,
        doctorId,
      });
    }

    progressRecord.doctorNotes.push({
      date: new Date(),
      note,
      doctorId,
    });

    await progressRecord.save();

    res.status(200).json({
      success: true,
      message: "Note added",
      data: progressRecord,
    });
  } catch (error) {
    console.error("Add doctor note error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get progress analytics and summary for a patient
// @route   GET /api/doctor/patients/:id/progress/analytics
// @access  Private (Doctor only)
exports.getProgressAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const { period = "3months" } = req.query;

    // Verify association
    const isAssociated = await isPatientAssociatedWithDoctor(doctorId, id);

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    }).populate("patientId", "name age gender height");

    if (!progressRecord) {
      return res.status(404).json({
        success: false,
        message: "No progress data found",
      });
    }

    // Calculate date range
    const monthsMap = { "1month": 1, "3months": 3, "6months": 6, "1year": 12 };
    const months = monthsMap[period] || 3;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const filteredEntries = progressRecord.progressData.filter(
      (entry) => entry.date >= startDate,
    );

    // Calculate trends
    const weightTrend = [];
    const bodyFatTrend = [];
    const adherenceScores = [];

    filteredEntries.forEach((entry) => {
      if (entry.weight)
        weightTrend.push({ date: entry.date, weight: entry.weight });
      if (entry.bodyFat)
        bodyFatTrend.push({ date: entry.date, bodyFat: entry.bodyFat });
      if (entry.overallScore !== undefined) {
        adherenceScores.push({ date: entry.date, score: entry.overallScore });
      }
    });
    // Calculate avg weekly change
    const weeklyChanges = [];
    for (let i = 1; i < filteredEntries.length; i++) {
      const prev = filteredEntries[i - 1];
      const curr = filteredEntries[i];
      if (prev.weight && curr.weight) {
        weeklyChanges.push(curr.weight - prev.weight);
      }
    }

    const avgWeeklyChange =
      weeklyChanges.length > 0 ?
        weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        patient: progressRecord.patientId,
        programType: progressRecord.programType,
        progressPercentage: progressRecord.calculateWeightProgress(),
        currentWeight: progressRecord.currentStats?.weight,
        initialWeight: progressRecord.initialStats?.weight,
        avgWeeklyChange: Math.round(avgWeeklyChange * 100) / 100,
        totalEntries: filteredEntries.length,
        weightTrend,
        bodyFatTrend,
        adherenceScores,
        goals: progressRecord.goals,
        status: progressRecord.status,
        lastReviewed: progressRecord.lastReviewed,
        unreadAlerts: progressRecord.alerts.filter((a) => !a.acknowledged)
          .length,
      },
    });
  } catch (error) {
    console.error("Get progress analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Pause/Resume/Cancel patient progress tracking
// @route   PUT /api/doctor/patients/:id/progress/status
// @access  Private (Doctor only)
exports.updateProgressStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const { status, reason } = req.body;

    if (!["active", "paused", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const progressRecord = await DoctorPatientProgress.findOne({
      patientId: id,
      doctorId,
    });

    if (!progressRecord) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found",
      });
    }

    progressRecord.status = status;

    if (reason) {
      progressRecord.doctorNotes.push({
        date: new Date(),
        note: `Status changed to ${status}: ${reason}`,
        doctorId,
      });
    }

    await progressRecord.save();

    res.status(200).json({
      success: true,
      message: `Progress tracking ${status}`,
      data: progressRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get all patient progress summaries for doctor's dashboard
// @route   GET /api/doctor/progress/summary
// @access  Private (Doctor only)
exports.getProgressSummary = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status } = req.query;

    const filter = { doctorId };
    if (status) filter.status = status;

    const progressRecords = await DoctorPatientProgress.find(filter)
      .populate("patientId", "name email age gender profilePicture")
      .sort({ updatedAt: -1 });

    const summary = progressRecords.map((record) => ({
      patient: record.patientId,
      programType: record.programType,
      progress: record.calculateWeightProgress(),
      startDate: record.startDate,
      lastEntry:
        record.progressData.length > 0 ?
          record.progressData[record.progressData.length - 1].date
        : null,
      status: record.status,
      nextFollowUp: record.nextFollowUp,
      unreadAlerts: record.alerts.filter((a) => !a.acknowledged).length,
      recentNote:
        record.doctorNotes.length > 0 ?
          record.doctorNotes[record.doctorNotes.length - 1]
        : null,
    }));

    res.status(200).json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Get progress summary error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== DOCTOR CHAT ====================

// @desc    Send message to patient
// @route   POST /api/doctor/chat/:patientId
// @access  Private (Doctor only)
exports.sendMessageToPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { message } = req.body;
    const doctorId = req.user._id;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const isAssociated = await Appointment.findOne({
      doctorId,
      userId: patientId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to message this patient",
      });
    }

    const msg = await Message.create({
      sender: doctorId,
      receiverId: patientId,
      message: message.trim(),
      seen: false,
    });

    const populatedMessage = await msg.populate(
      "sender",
      "name email profilePicture",
    );

    getIO().to(patientId.toString()).emit("receiveMessage", populatedMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get conversation with a patient
// @route   GET /api/doctor/chat/:patientId
// @access  Private (Doctor only)
exports.getPatientConversation = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;

    const isAssociated = await Appointment.findOne({
      doctorId,
      userId: patientId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this conversation",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: doctorId, receiverId: patientId },
        { sender: patientId, receiverId: doctorId },
      ],
    })
      .populate("sender", "name email profilePicture")
      .sort("createdAt");

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get all patient conversations (with last message and unread count)
// @route   GET /api/doctor/chat/conversations
// @access  Private (Doctor only)
exports.getAllConversations = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const patientIds = await getDoctorPatients(doctorId);

    if (patientIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const conversations = await Promise.all(
      patientIds.map(async (patientId) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: doctorId, receiverId: patientId },
            { sender: patientId, receiverId: doctorId },
          ],
        })
          .populate("sender", "name profilePicture")
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          sender: patientId,
          receiverId: doctorId,
          seen: false,
        });

        const patient = await User.findById(patientId).select(
          "name email profilePicture",
        );

        return {
          patientId,
          patient,
          lastMessage,
          unreadCount,
        };
      }),
    );

    const filtered = conversations.filter((c) => c.lastMessage);

    filtered.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

    res.status(200).json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Mark messages from patient as seen
// @route   PATCH /api/doctor/chat/:patientId/seen
// @access  Private (Doctor only)
exports.markMessagesAsSeen = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;

    const result = await Message.updateMany(
      {
        sender: patientId,
        receiverId: doctorId,
        seen: false,
      },
      { seen: true },
    );

    getIO().to(patientId.toString()).emit("messagesSeen", { userId: doctorId });

    res.status(200).json({
      success: true,
      message: "Messages marked as seen",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Mark as seen error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Create doctor schedule entry
// @route   POST /api/doctor/schedule
// @access  Private (Doctor only)
exports.createSchedule = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const {
      date,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      maxAppointments,
      notes,
    } = req.body;

    // Check for overlapping schedule on the same date
    const existingSchedule = await DoctorSchedule.findOne({
      doctorId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "A schedule for this date already exists. Use PUT to update.",
      });
    }

    const schedule = await DoctorSchedule.create({
      doctorId,
      date,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      maxAppointments,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @route   GET /api/doctor/schedule
// @access  Private (Doctor only)
exports.getSchedule = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { startDate, endDate } = req.query;

    const filter = { doctorId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to next 30 days
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 30);

      filter.date = { $gte: start, $lte: end };
    }

    const schedules = await DoctorSchedule.find(filter)
      .sort({ date: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @route   PUT /api/doctor/schedule/:id
// @access  Private (Doctor only)
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const {
      date,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      maxAppointments,
      notes,
    } = req.body;

    const schedule = await DoctorSchedule.findOne({ _id: id, doctorId });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Check for overlapping schedule on the new date (excluding current schedule)
    if (
      date &&
      new Date(date).toDateString() !== new Date(schedule.date).toDateString()
    ) {
      const overlappingSchedule = await DoctorSchedule.findOne({
        doctorId,
        date: {
          $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
        _id: { $ne: id },
      });

      if (overlappingSchedule) {
        return res.status(400).json({
          success: false,
          message: "A schedule for this date already exists.",
        });
      }
    }

    const updatedSchedule = await DoctorSchedule.findOneAndUpdate(
      { _id: id, doctorId },
      {
        date,
        startTime,
        endTime,
        breakStart,
        breakEnd,
        maxAppointments,
        notes,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @route   DELETE /api/doctor/schedule/:id
// @access  Private (Doctor only)
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    const schedule = await DoctorSchedule.findOneAndDelete({
      _id: id,
      doctorId,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
