const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const EmailOtp = require("../models/emailOtp");
const { sendEmail } = require("../config/email");
const generateToken = require("../utils/generateToken");
const { ALL_ROLES, ROLES } = require("../constants/roles");

const OTP_DURATION_MS = 10 * 60 * 1000;

const createOtpCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const clearOtp = async (email) => {
  await EmailOtp.deleteOne({ email });
};

const ensureOtpValid = async (email, otp) => {
  const record = await EmailOtp.findOne({ email });
  if (!record) {
    throw new Error("OTP not requested for this email");
  }
  if (record.expiresAt < Date.now()) {
    await clearOtp(email);
    throw new Error("OTP has expired");
  }

  const isMatch = await bcrypt.compare(otp, record.otp);
  if (!isMatch) {
    throw new Error("OTP is incorrect");
  }

  record.verified = true;
  await record.save();
};

const buildOtpMessage = (otp) => `
  <div style="font-family: Arial, sans-serif; padding: 16px;">
    <h2 style="color:#ef4444;">Your FitTrack verification code</h2>
    <p>Enter the code below in the app to complete registration.</p>
    <div style="font-size: 24px; letter-spacing: 6px; margin: 16px 0; font-weight: bold;">${otp}</div>
    <p>This code expires in 10 minutes.</p>
  </div>
`;
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      age,
      height,
      weight,
      goal,
      coachId,
      otp,
    } = req.body;
    const normalizedRole =
      typeof role === "string" && role.trim().length > 0 ?
        role.trim().toLowerCase()
      : ROLES.USER;

    if (!ALL_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    if (normalizedRole === ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Admin registration is not allowed from public endpoint",
      });
    }

    const userExists = await User.findOne({
      email,
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be 6 characters",
      });
    }

    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }

    try {
      await ensureOtpValid(email, otp);
    } catch (verificationErr) {
      return res.status(400).json({
        success: false,
        message: verificationErr.message,
      });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: normalizedRole,
      age,
      height,
      weight,
      goal,
      coachId,
    });
    const token = generateToken(user._id, user.role);
    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          goal: user.goal,
        },
      });
      await clearOtp(email);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const allowedDomains = ["gmail.com", "yahoo.com"];

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required for OTP",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split("@")[1];

    if (!allowedDomains.includes(domain)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only Gmail and Yahoo emails are allowed",
        });
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const otpCode = createOtpCode();
    const hashed = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + OTP_DURATION_MS);

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp: hashed, expiresAt, verified: false },
      { upsert: true, new: true },
    );

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: "FitTrack verification code",
      html: buildOtpMessage(otpCode),
    });

    res.status(200).json({
      success: true,
      message:
        emailResult.success ?
          "OTP sent to your email"
        : "OTP generated (email service disabled)",
      expiresIn: OTP_DURATION_MS / 1000,
    });
  } catch (err) {
    console.error("sendRegistrationOtp", err);
    res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Both email and OTP are required",
      });
    }

    await ensureOtpValid(email, otp);
    await clearOtp(email);
    res.status(200).json({ success: true, message: "OTP verified" });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // check email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const token = generateToken(user._id, user.role);
    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        goal: user.goal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// het all user

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate([
        {
          path: "assignedCoach",
          select: "_id name email profilePicture specialization role",
        },
        {
          path: "coachId",
          select: "_id name email profilePicture specialization role",
        },
      ]);
    // console.log("backend data", user);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
