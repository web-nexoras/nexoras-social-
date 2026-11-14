const userSchema = require("../../models/User");
const { getOtp, deleteOtp, isRedisEnabled } = require("../../helpers/otpStore");

// ---------------- Verify OTP Controller
const verifyOtp = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  try {
    // -------- Validate input
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const user = await userSchema.findOne({ email, isVerified: false }).select("+otp +otpExpires");
    if (!user) return res.status(400).json({ success: false, message: "Invalid OTP or user not found" });

    let isValid = false;

    if (isRedisEnabled()) {
      const redisOtp = await getOtp(email);
      isValid = !!redisOtp && redisOtp === otp;
    } else {
      isValid = user.otp === otp && !!user.otpExpires && user.otpExpires > new Date();
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // -------- Mark email as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await deleteOtp(email);

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { verifyOtp };
