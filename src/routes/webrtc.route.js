const express = require("express");
const router = express.Router();
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

router.get("/ice", async (req, res) => {
  try {
    const token = await client.tokens.create();
    res.json(token.iceServers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
