const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controllers");
const { protect } = require("../middleware/auth.middleware");
const loginLimiter = require("../middleware/loginLimit.middleware");

router.post("/register", authController.registerUser);
router.post("/login", loginLimiter, authController.loginUser);
router.get("/me", protect, authController.getMe);
router.get("/users", authController.getAllUsers);
router.post("/reset-password", authController.resetPassword);
module.exports = router;
