const mongoose = require("mongoose");
const Patient = require("../models/doctorPatient.model"); // 👈 ensure model exists
const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const Prescription = require("../models/prescription.model");
const Report = require("../models/report.model");
const Subscription = require("../models/subscription.model");
const DoctorPatient = require("../models/doctorPatient.model.js");
console.log("DoctorPatient:", DoctorPatient);
const {
  sendEmail,
  emailTemplates,
  isEmailConfigured,
} = require("../config/email");
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
    const isAssociated = await Appointment.findOne({
      doctorId: req.user._id,
      userId: id,
    });

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
    const { userId, medicines, notes, isEmergency } = req.body;

    if (!userId || !medicines || !Array.isArray(medicines)) {
      return res.status(400).json({
        success: false,
        message: "Please provide user ID and medicines array",
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

    // Verify association with doctor
    const isAssociated = await Appointment.findOne({
      doctorId: req.user._id,
      userId,
    });

    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to prescribe this patient",
      });
    }

    const prescription = await Prescription.create({
      userId,
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
    const isAssociated = await Appointment.findOne({
      doctorId: req.user._id,
      userId: id,
    });

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
