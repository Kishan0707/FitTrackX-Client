const { ROLES } = require("../constants/roles");

exports.adminOnly = async (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Access Denied, Admin only",
    });
  }
  next();
};
