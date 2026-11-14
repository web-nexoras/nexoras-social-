const { redisClient } = require("../config/radisConfig");

// Attach redis client to req when available (non-blocking).
const attachRedis = (req, res, next) => {
  req.redis = redisClient && redisClient.isOpen ? redisClient : null;
  next();
};

// Use on routes that strictly require Redis.
const requireRedis = (req, res, next) => {
  if (!req.redis) {
    return res.status(503).json({
      success: false,
      message: "Redis is not available. Set REDIS_ENABLED=true and start Redis.",
    });
  }
  next();
};

module.exports = { attachRedis, requireRedis };
