const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { sendMessage, getConversation, markSeen } = require("../controller/message.controller");

router.use(protect);

router.post("/", sendMessage);
router.get("/:userId", getConversation);
router.patch("/:userId/seen", markSeen);

module.exports = router;
