const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateProfile,
  updatePreferences,
  updatePrivacy,
  updateNotifications,
  changePassword,
  deleteAccount,
  uploadProfilePicture,
} = require("../controller/settings.controller");
const { protect } = require("../middleware/auth.middleware");
const multer = require("multer");
const path = require("path");

// Multer configuration for profile picture
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// All routes require authentication
router.use(protect);

// Get all settings
router.get("/", getSettings);

// Update profile
router.put("/profile", updateProfile);

// Update preferences
router.put("/preferences", updatePreferences);

// Update privacy
router.put("/privacy", updatePrivacy);

// Update notifications
router.put("/notifications", updateNotifications);

// Change password
router.put("/password", changePassword);

// Upload profile picture
router.post(
  "/profile-picture",
  upload.single("profilePicture"),
  uploadProfilePicture,
);

// Delete account
router.delete("/account", deleteAccount);

module.exports = router;
