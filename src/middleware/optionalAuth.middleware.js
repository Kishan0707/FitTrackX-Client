const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Best-effort auth: attaches req.user when a valid Bearer token is present.
// Never blocks the request (unlike protect).
exports.optionalProtect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user) req.user = user;
  } catch {
    // Ignore invalid/expired tokens for optional auth.
  }

  next();
};
