import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const isEmailConfigured = !!process.env.RESEND_API_KEY;
const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: "FitTrack <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", response);
    return { success: true };
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
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
