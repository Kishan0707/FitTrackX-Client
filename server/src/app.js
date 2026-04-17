//app.js
const express = require("express");
const cors = require("cors");
const cookie = require("cookie-parser");
const morgan = require("morgan");
const productRoutes = require("./routes/product.route");

const authRoutes = require("./routes/auth.route");
const workoutRoutes = require("./routes/workout.route"); //
const app = express();
const dietRoutes = require("./routes/diet.route");
const bodyMeasurementRoutes = require("./routes/bodyMeasurement.route");
const progressPhotoRoutes = require("./routes/progressphoto.route");
const progressRoutes = require("./routes/progress.route");
const healthRoutes = require("./routes/health.route");
const statisticsRoutes = require("./routes/statistics.route");
const adminRoutes = require("./routes/admin.route");
const coachRoutes = require("./routes/coach.route");
const planRoutes = require("./routes/plan.route");
const aiWorkoutRoutes = require("./routes/aiWorkout.route");
const pdfRoutes = require("./routes/pdf.route");
const loggerTestRoutes = require("./routes/loggerTest.route");
const settingsRoutes = require("./routes/settings.route");
const emailRoutes = require("./routes/email.route");
const cartRoutes = require("./routes/cart.route");
const sellerRoutes = require("./routes/seller.route");
const affiliateRoutes = require("./routes/affiliate.routes");
const exportRoutes = require("./routes/export.route");
const orderRoutes = require("./routes/order.route");
const notificationRoutes = require("./routes/notification.route");
const coachActivityRoutes = require("./routes/coachActivity.route");
const sessionRoutes = require("./routes/session.routes");
const messageRoutes = require("./routes/message.route");
const stepsRoutes = require("./routes/steps.route");
const subscriptionRoutes = require("./routes/subscription.route");
const onboardingRoutes = require("./routes/onboarding.route");
const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const hpp = require("hpp");

const apiLimiter = require("./middleware/rateLimit.middleware");
const paymentRoutes = require("./routes/payment.route");
const logger = require("../src/config/logger");
const errorHandler = require("./middleware/error.middleware");
const redis = require("./config/redis");
const allowedOrigins = [
  "http://localhost:5173",
  "https://fit-track-x-clients.vercel.app",
  "https://fittrackx-client.onrender.com", // if you call API from same domain later
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // allow all vercel preview deployments for this project
  if (/^https:\/\/fit-track-x-clients.*\.vercel\.app$/.test(origin))
    return true;
  return false;
};
app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    preflightContinue: false,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use("/api/payment", paymentRoutes);
app.use(express.json());
app.use(cookie());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  }),
);
app.set("trust proxy", 1);

// Security Middleware
app.use(helmet()); // Add Helmet for security headers
// app.use(mongoSanitize()); // Prevent NoSQL injection
// app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use("/api", apiLimiter); // Apply rate limiting to all requests

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes); //

app.use("/api/diet", dietRoutes);

app.use("/api/body-measurements", bodyMeasurementRoutes);
app.use("/api/progress-photo", progressPhotoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/stats", statisticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/plans", planRoutes);

app.use("/api/ai", aiWorkoutRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/logger", loggerTestRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", coachActivityRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/steps", stepsRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/onboarding", onboardingRoutes);

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/affiliate", affiliateRoutes);
//
app.get("/", (req, res) => {
  res.send("FitTrack X API Running 🚀");
});
app.get("/set", async (req, res) => {
  await redis.set("test", "hello", { ex: 60 }); // 60 sec expiry
  res.send("Data set in Redis");
});
app.get("/get", async (req, res) => {
  const data = await redis.get("test");
  res.send(data);
});
app.use(errorHandler);
module.exports = app;
