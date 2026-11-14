const userSchema = require("../../models/User");
const { hashToken } = require("../../helpers/authUtils");

// ---------------- Reset Password Controller
const resetPassword = async (req, res) => {
  const token = req.params.token || req.body.token;
  const email = String(req.body.email || req.query.email || "").trim().toLowerCase();
  const { password } = req.body;

  try {
    // -------- Validate input
    if (!token || !email) return res.status(400).json({ success: false, message: "Email and reset token are required" });
    if (!password || password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });

    // -------- Find user with valid reset token
    const user = await userSchema.findOne({
      email,
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset link" });

    // -------- Save new password and invalidate current sessions
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await userSchema.findByIdAndUpdate(user._id, { $unset: { refreshTokenHash: 1 } });

    const { getCookieOptions } = require("../../helpers/cookieOptions");
    const cookieOptions = getCookieOptions();
    res.clearCookie("accTkn", cookieOptions);
    res.clearCookie("refTkn", cookieOptions);
    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { resetPassword };
