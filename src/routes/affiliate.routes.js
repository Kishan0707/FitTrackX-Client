const express = require("express");
const router = express.Router();

const affiliateController = require("../controller/affiliate.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/me", protect, affiliateController.getMyAffiliate);

module.exports = router;
