const redisClient = require("../config/redis");

const cache = (prefix) => {
  return async (req, res, next) => {
    if (
      !redisClient ||
      typeof redisClient.get !== "function" ||
      (typeof redisClient.isEnabled === "function" && !redisClient.isEnabled())
    ) {
      return next();
    }

    const userId = req.user?._id || req.user?.id;
    const key = `${prefix}:${userId || "anonymous"}`;
    req.cacheKey = key;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        let result = cachedData;
        if (typeof cachedData === "string") {
          try {
            result = JSON.parse(cachedData);
          } catch (e) {
            result = cachedData;
          }
        }

        return res.status(200).json({
          success: true,
          source: "redis-cache",
          data: result,
        });
      }

      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          const dataToCache = body?.data ?? body;
          if (dataToCache !== undefined) {
            await redisClient.set(key, JSON.stringify(dataToCache), { ex: 3600 });
          }
        } catch (cacheError) {
          console.error("Redis cache set error:", cacheError);
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      if (typeof redisClient.disable === "function") {
        redisClient.disable("cache middleware read failure");
      }
      console.error("Redis get error:", err.message || err);
      next();
    }
  };
};

module.exports = cache;
