const nodemailer = require("nodemailer");

// Check if email credentials are configured
const isEmailConfigured =
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.EMAIL_USER !== "ahirk7317@gmail.com";

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log("EMAIL CONFIG:", {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD ? "YES" : "NO",
  });
  console.log("✅ Email service configured");
} else {
  console.log("⚠️  Email service not configured - Email features disabled");
}

const sendEmail = async (options) => {
  if (!isEmailConfigured) {
    throw new Error("Email service not configured");
  }

  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "FitTrack"} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ FULL EMAIL ERROR:", error);
    throw error; // 🔥 IMPORTANT
  }
};

const emailTemplates = {
  welcome: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Welcome to FitTrack! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining FitTrack. We're excited to help you achieve your fitness goals!</p>
      <p>Get started by:</p>
      <ul>
        <li>Setting up your profile</li>
        <li>Logging your first workout</li>
        <li>Tracking your meals</li>
      </ul>
      <p>Best regards,<br>The FitTrack Team</p>
    </div>
  `,

  workoutReminder: (name, workoutType) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Time for Your Workout! 💪</h2>
      <p>Hi ${name},</p>
      <p>Don't forget your ${workoutType} workout today!</p>
      <p>Stay consistent and reach your goals.</p>
      <p>Best regards,<br>The FitTrack Team</p>
    </div>
  `,

  goalAchieved: (name, goal) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Congratulations! 🏆</h2>
      <p>Hi ${name},</p>
      <p>You've achieved your goal: ${goal}!</p>
      <p>Keep up the great work and set new challenges for yourself.</p>
      <p>Best regards,<br>The FitTrack Team</p>
    </div>
  `,

  subscriptionConfirmation: (name, planName, duration) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Subscription Confirmed! ✅</h2>
      <p>Hi ${name},</p>
      <p>Your subscription to <strong>${planName}</strong> has been confirmed.</p>
      <p>Duration: ${duration} days</p>
      <p>Thank you for choosing FitTrack Premium!</p>
      <p>Best regards,<br>The FitTrack Team</p>
    </div>
  `,

  passwordReset: (name, resetLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Password Reset Request 🔐</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the button below:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link expires in 1 hour.</p>
      <p>Best regards,<br>The FitTrack Team</p>
    </div>
  `,
  notificationAlert: (name, title, message) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">${title}</h2>
      <p>Hi ${name},</p>
      <p>${message}</p>
      <p>Open the FitTrack dashboard to see the latest activity.</p>
      <p>Best regards,<br>The FitTrack Team</p>
    </div>
  `,
};

module.exports = { sendEmail, emailTemplates, isEmailConfigured };
