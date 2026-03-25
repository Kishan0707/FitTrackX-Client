const redisClient = require("../config/redis");

const cache = (prefix) => {
  return async (req, res, next) => {
    try {
      const key = `${prefix}:${req.user.id}`;
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          source: "redis-cache",
          data: JSON.parse(cachedData),
        });
      }
      next();
    } catch (err) {
      console.error("Redis get error:", err);
      return next();
    }
  };
};
module.exports = cache;
