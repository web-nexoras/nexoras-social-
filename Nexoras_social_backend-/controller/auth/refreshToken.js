const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { generateAccessToken, generateRefreshToken, hashToken, getJwtRefreshSecret } = require("../../helpers/authUtils");

const refreshToken = async (req, res) => {
  const token = req.cookies?.refTkn || req.body?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: "Refresh token is required" });
  try {
    const payload = jwt.verify(token, getJwtRefreshSecret());
    const user = await User.findById(payload.sub).select("+refreshTokenHash");
    if (!user || user.refreshTokenHash !== hashToken(token)) return res.status(401).json({ success: false, message: "Refresh token has been revoked" });
    const accessToken = generateAccessToken(user);
    const nextRefreshToken = generateRefreshToken(user);
    user.refreshTokenHash = hashToken(nextRefreshToken);
    await user.save({ validateBeforeSave: false });
    const { getCookieOptions } = require("../../helpers/cookieOptions");
    const opts = getCookieOptions();
    res.cookie("accTkn", accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
    res.cookie("refTkn", nextRefreshToken, { ...opts, maxAge: 15 * 24 * 60 * 60 * 1000 });
    return res.json({
      success: true,
      message: "Session refreshed",
      accessToken,
      refreshToken: nextRefreshToken,
    });
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};
module.exports = { refreshToken };
