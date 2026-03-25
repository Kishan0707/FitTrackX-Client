const redis = require("../config/redis");

const redisCache = (prefix) => {
  return async (req, res, next) => {
    try {
      const key = `${prefix}:${req.user.id}`;

      const cachedData = await redis.get(key);

      if (cachedData) {
        return res.status(200).json({
          success: true,
          source: "redis-cache",
          data: cachedData, // ❗ Upstash me parse ki zarurat nahi hoti
        });
      }

      // 🔥 intercept response to save later
      res.sendResponse = res.json;

      res.json = async (body) => {
        await redis.set(key, body.data, { ex: 60 }); // 60 sec cache
        res.sendResponse(body);
      };

      next();
    } catch (err) {
      console.error("Redis error:", err);
      next();
    }
  };
};

module.exports = redisCache;
