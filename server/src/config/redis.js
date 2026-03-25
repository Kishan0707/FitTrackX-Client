const { Redis } = require("@upstash/redis");

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;

const redisClient = new Redis({
  url: redisUrl,
  token: redisToken,
});

module.exports = redisClient;
