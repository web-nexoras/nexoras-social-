const { redisClient } = require("../config/radisConfig");

const OTP_TTL_SECONDS = 5 * 60;

function isRedisEnabled() {
  return process.env.REDIS_ENABLED === "true" && redisClient && redisClient.isOpen;
}

const setOtp = async (email, otp) => {
  if (!isRedisEnabled()) return;
  await redisClient.set(`otp:${email.toLowerCase()}`, otp, { EX: OTP_TTL_SECONDS });
};

const getOtp = async (email) => {
  if (!isRedisEnabled()) return null;
  return redisClient.get(`otp:${email.toLowerCase()}`);
};

const deleteOtp = async (email) => {
  if (!isRedisEnabled()) return;
  await redisClient.del(`otp:${email.toLowerCase()}`);
};

module.exports = { setOtp, getOtp, deleteOtp, OTP_TTL_SECONDS, isRedisEnabled };
