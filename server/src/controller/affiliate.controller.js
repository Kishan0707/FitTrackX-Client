const Affiliate = require("../models/affiliate.model");
exports.getMyAffiliate = async (req, res) => {
  const data = await Affiliate.findOne({
    userId: req.user._id,
  });

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Affiliate not found",
    });
  }

  res.json({
    success: true,
    ...data._doc,
  });
};
