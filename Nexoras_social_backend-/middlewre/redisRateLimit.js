const { getRedisClient } = require("../helpers/redis");

// Redis-backed rate limiter (falls back gracefully if Redis is unavailable).
const redisRateLimit = ({ windowSeconds = 60, max = 20, keyPrefix = "rl" } = {}) => {
  return async (req, res, next) => {
    const redis = getRedisClient();
    if (!redis) return next();

    try {
      const ip = req.ip || req.connection?.remoteAddress || "unknown";
      const key = `${keyPrefix}:${ip}:${req.path}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);

      if (count > max) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      }
      next();
    } catch (error) {
      console.error("Redis rate limit error:", error.message);
      next();
    }
  };
};

module.exports = { redisRateLimit };
