const userSchema = require("../../models/User");
const { mailSender } = require("../../helpers/email/mailservice");
const { generateOTP, isValidEmail } = require("../../helpers/authUtils");
const { setOtp } = require("../../helpers/otpStore");

// ---------------- Resend OTP Controller
const resendOtp = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  try {
    // -------- Validate input
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Invalid email" });

    // -------- Find unverified user
    const user = await userSchema.findOne({ email, isVerified: false }).select("+otp +otpExpires");
    if (!user) return res.status(400).json({ success: false, message: "Invalid request" });

    // -------- Generate OTP and expiration
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // -------- Mirror OTP to Redis for 5-minute auto-expiry (if enabled)
    await setOtp(email, otp);

    // -------- Send OTP
    await mailSender({ email: user.email, subject: "OTP Verification", otp });
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      // Dev-only: expose the OTP so verification works even when the address can't receive mail
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ success: false, message: "Could not send OTP. Check mail configuration." });
  }
};

module.exports = { resendOtp };
