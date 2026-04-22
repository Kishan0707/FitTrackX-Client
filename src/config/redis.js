const { Redis } = require("@upstash/redis");

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;

const hasRedisConfig = Boolean(redisUrl && redisToken);
let redisEnabled = hasRedisConfig;
let disableReason = null;

if (!hasRedisConfig) {
  console.warn(
    "WARNING: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Redis caching will not work.",
  );
}

const client =
  hasRedisConfig ?
    new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

const isAuthOrConfigError = (err) => {
  const message = String(err?.message || "").toLowerCase();
  return (
    message.includes("wrongpass") ||
    message.includes("invalid or missing auth token") ||
    message.includes("http_unauthorized") ||
    (message.includes("token") && message.includes("missing"))
  );
};

const disableRedis = (reason, err) => {
  if (!redisEnabled) return;
  redisEnabled = false;
  disableReason = reason || "unknown";
  const detail = err?.message ? ` (${err.message})` : "";
  console.warn(`Redis disabled: ${disableReason}${detail}`);
};

const run = async (operation, fallbackValue) => {
  if (!redisEnabled || !client) return fallbackValue;

  try {
    return await operation(client);
  } catch (err) {
    if (isAuthOrConfigError(err)) {
      disableRedis("invalid Upstash credentials/config", err);
      return fallbackValue;
    }
    throw err;
  }
};

const redisClient = {
  isEnabled: () => redisEnabled && Boolean(client),
  getDisableReason: () => disableReason,
  disable: (reason) => disableRedis(reason),
  get: (key) => run((activeClient) => activeClient.get(key), null),
  set: (key, value, options) =>
    run((activeClient) => activeClient.set(key, value, options), null),
  del: (...keys) => run((activeClient) => activeClient.del(...keys), 0),
  ping: async () => {
    if (!redisEnabled || !client) {
      throw new Error(disableReason || "Redis is disabled");
    }
    const result = await run((activeClient) => activeClient.ping(), null);
    if (result === null) {
      throw new Error(disableReason || "Redis ping failed");
    }
    return result;
  },
};

module.exports = redisClient;
