const express = require("express");
const router = express.Router();

const upload = require("../middleware/multer.middleware");
const controller = require("../controller/progressPhoto.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/upload", protect, upload.single("photo"), controller.uploadPhoto);

module.exports = router;
