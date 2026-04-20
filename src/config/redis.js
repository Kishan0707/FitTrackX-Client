const { Redis } = require("@upstash/redis");

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  console.warn(
    "WARNING: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_TOKEN. Redis caching will not work.",
  );
}

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

module.exports = redisClient;
