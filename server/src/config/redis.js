const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log("❌ Redis reconnect stopped");
        return new Error("Retry limit reached");
      }
      return Math.min(retries * 200, 2000);
    },
  },
});

redisClient.on("connect", () => console.log("✅ Redis Connected"));
redisClient.on("error", (err) => console.log("❌ Redis Error", err));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.log("❌ Redis not Connected");
  }
};

module.exports = { redisClient, connectRedis };
