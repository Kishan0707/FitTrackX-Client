const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controllers.js");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const loginLimiter = require("../middleware/loginLimit.middleware");
const { ROLES } = require("../constants/roles");

router.post("/send-otp", authController.sendRegistrationOtp);
router.post("/verify-otp", authController.verifyRegistrationOtp);
router.post("/register", authController.registerUser);
router.post("/login", loginLimiter, authController.loginUser);
router.get("/me", protect, authController.getMe);
router.get("/users", protect, authorizeRoles(ROLES.ADMIN), authController.getAllUsers);
router.post("/reset-password", authController.resetPassword);
module.exports = router;
