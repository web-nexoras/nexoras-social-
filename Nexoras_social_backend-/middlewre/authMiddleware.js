const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { safeGet, safeSet } = require("../helpers/redis");
const { getJwtSecret } = require("../helpers/authUtils");

const authMiddleware = async (req, res, next) => {
  let headerToken = req.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  let cookieToken = req.cookies?.accTkn;

  if (!headerToken || headerToken === "undefined" || headerToken === "null") headerToken = null;
  if (!cookieToken || cookieToken === "undefined" || cookieToken === "null") cookieToken = null;

  const token = headerToken || cookieToken;

  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

  let payload = null;
  const secret = getJwtSecret();
  try {
    payload = jwt.verify(token, secret);
  } catch (_error) {
    // If header token was invalid/expired but cookie exists, attempt fallback
    if (headerToken && cookieToken && token === headerToken) {
      try {
        payload = jwt.verify(cookieToken, secret);
      } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired access token" });
      }
    } else {
      return res.status(401).json({ success: false, message: "Invalid or expired access token" });
    }
  }

  try {
    const cacheKey = `authuser:${payload.sub}`;
    let user = null;

    // Cache read is best-effort: if Redis is down we simply hit the database.
    const cached = await safeGet(cacheKey);
    if (cached) {
      try {
        user = User.hydrate(JSON.parse(cached));
      } catch {
        user = null;
      }
    }

    if (!user) {
      user = await User.findById(payload.sub).select("-password");
      if (!user) return res.status(401).json({ success: false, message: "User not found, token invalid" });
      await safeSet(cacheKey, JSON.stringify(user), { EX: 60 });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Authentication processing failed" });
  }
};

module.exports = { authMiddleware };
