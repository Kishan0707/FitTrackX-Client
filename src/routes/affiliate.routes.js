const express = require("express");
const router = express.Router();

const affiliateController = require("../controller/affiliate.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.get(
  "/me",
  protect,
  authorizeRoles(ROLES.AFFILIATE, ROLES.ADMIN),
  affiliateController.getMyAffiliate,
);

module.exports = router;
