const { Redis } = require("@upstash/redis");

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.on("error", (err) => console.log("❌ Redis Error", err));

module.exports = redisClient;
