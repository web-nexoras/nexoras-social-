const crypto = require("crypto");
const userSchema = require("../../models/User");
const { isValidEmail, hashToken } = require("../../helpers/authUtils");
const { mailSender } = require("../../helpers/email/mailservice");

// ---------------- Forgot Password Controller
const forgotPassword = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  try {
    // -------- Validation
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Invalid email" });

    // -------- Find User
    const user = await userSchema.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
    const successMessage = "If an account exists for this email, a reset link has been sent";
    if (!user) return res.status(200).json({ success: true, message: successMessage });

    // -------- Generate and save hashed reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // -------- Send reset link
    const resetLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;
    try {
      await mailSender({ email: user.email, subject: "Password Reset Request", resetLink });
    } catch (mailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Reset email failed:", mailError.message);
      return res.status(503).json({ success: false, message: "Failed to send reset email" });
    }

    return res.status(200).json({
      success: true,
      message: successMessage,
      // Dev-only: expose the reset link so the flow works even when the address can't receive mail
      ...(process.env.NODE_ENV !== "production" ? { devResetLink: resetLink } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { forgotPassword };
