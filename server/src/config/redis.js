const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});
redisClient.on("connect", () => console.log("Redis Client Connected"));
redisClient.on("error", (err) => console.log("Redis Client Error", err));
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.log("Redis not Connected");
  }
})();
module.exports = redisClient;
