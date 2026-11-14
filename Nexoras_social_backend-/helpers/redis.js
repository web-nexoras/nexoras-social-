const { redisClient } = require("../config/radisConfig");

const getRedisClient = () => (redisClient && redisClient.isOpen ? redisClient : null);
const isRedisAvailable = () => !!getRedisClient();

// ---------------------------------------------------------------------------
// Redis is an OPTIONAL accelerator (cache + rate limit only). Every call site
// must use these safe wrappers so a Redis outage degrades to "no cache" —
// never to a 401/500 response or a crashed process.
// ---------------------------------------------------------------------------

const safeGet = async (key) => {
  try {
    const redis = getRedisClient();
    return redis ? await redis.get(key) : null;
  } catch {
    return null;
  }
};

const safeSet = async (key, value, options) => {
  try {
    const redis = getRedisClient();
    if (redis) await redis.set(key, value, options);
    return true;
  } catch {
    return false;
  }
};

const safeDel = async (...keys) => {
  try {
    const redis = getRedisClient();
    if (redis) await redis.del(keys);
    return true;
  } catch {
    return false;
  }
};

const safeSAdd = async (setKey, member) => {
  try {
    const redis = getRedisClient();
    if (redis) await redis.sAdd(setKey, member);
    return true;
  } catch {
    return false;
  }
};

const safeSRem = async (setKey, member) => {
  try {
    const redis = getRedisClient();
    if (redis) await redis.sRem(setKey, member);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  getRedisClient,
  isRedisAvailable,
  safeGet,
  safeSet,
  safeDel,
  safeSAdd,
  safeSRem,
};
