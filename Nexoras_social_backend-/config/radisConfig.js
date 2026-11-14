const { createClient } = require("redis");

// ---------------------------------------------------------------------------
// Redis is OPTIONAL in this app — every consumer (auth cache, rate limiter,
// presence) falls back cleanly when it is missing (see helpers/redis.js).
// This module must therefore never break a deployment:
//   - bounded retries, so a bad/unreachable REDIS_URL can't flood host logs
//   - non-blocking start, so server boot never waits on Redis
//   - a single actionable warning instead of a repeating stack trace
// ---------------------------------------------------------------------------

const MAX_RETRIES = 4;
let announcedFailure = false;

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= MAX_RETRIES) return false; // give up for good, no log spam
      return Math.min(500 * retries, 3000); // short backoff while retrying
    },
  },
});

redisClient.on("ready", () => {
  announcedFailure = false;
  console.log("Redis connected and ready");
});

redisClient.on("error", (error) => {
  // Never throw here — an unhandled 'error' event would crash the process.
  if (announcedFailure) return;
  announcedFailure = true;
  console.warn(
    [
      `[Redis] unavailable — running WITHOUT Redis. Login, auth, chat and all APIs still work; only cache/rate-limit are off.`,
      `         Fix: attach a Redis instance and set REDIS_URL (e.g. rediss://:password@host:6379) + REDIS_ENABLED=true,`,
      `         or set REDIS_ENABLED=false to skip Redis entirely.`,
      `         Last error: ${error.message}`,
    ].join("\n"),
  );
});

const redisConfig = async () => {
  if (redisClient.isOpen) return redisClient;
  // Fire-and-forget: boot the server immediately, let Redis join when it can.
  redisClient.connect().catch((error) => {
    if (!announcedFailure) {
      announcedFailure = true;
      console.warn(`[Redis] startup failed: ${error.message} — continuing without Redis`);
    }
  });
  return redisClient;
};

module.exports = { redisConfig, redisClient };
