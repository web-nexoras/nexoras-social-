const jwt = require("jsonwebtoken");
const userSchema = require("../../models/User");
const { getJwtRefreshSecret } = require("../../helpers/authUtils");

// ---------------- Logout Controller
const logout = async (req, res) => {
  try {
    // -------- Revoke refresh token for this session
    const refreshToken = req.cookies?.refTkn;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
        await userSchema.findByIdAndUpdate(decoded.sub, { $unset: { refreshTokenHash: 1 } });
      } catch (_error) {
        // Expired/invalid tokens are still cleared from the browser.
      }
    }

    // -------- Clear auth cookies
    const { getCookieOptions } = require("../../helpers/cookieOptions");
    const cookieOptions = getCookieOptions();
    return res
      .clearCookie("accTkn", cookieOptions)
      .clearCookie("refTkn", cookieOptions)
      .status(200)
      .json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { logout };
