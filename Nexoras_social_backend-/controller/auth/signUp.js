const userSchema = require("../../models/User");
const { mailSender } = require("../../helpers/email/mailservice");
const { generateOTP, isValidEmail } = require("../../helpers/authUtils");
const { setOtp } = require("../../helpers/otpStore");

// ---------------- Signup Controller
const signup = async (req, res) => {
  const fullname = String(req.body.fullname || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const { password } = req.body;
  const role = "user";

  try {
    // -------- Validate input
    if (!fullname) return res.status(400).json({ success: false, message: "Full name is required" });
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Invalid email" });
    if (!password || password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });

    // -------- Check existing user
    const existingUser = await userSchema.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: "User with this email already exists" });

    // -------- Generate OTP and create account (pending admin approval until verified + approved)
    const otp = generateOTP();
    const user = await userSchema.create({
      fullname,
      email,
      password,
      role,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000,
      isApproved: false,
      status: "pending",
    });

    // -------- Mirror OTP to Redis for 5-minute auto-expiry (if enabled)
    await setOtp(email, otp);

    // -------- Send OTP before confirming signup so mail failures are visible
    try {
      await mailSender({ email, subject: "OTP Verification", otp });
    } catch (mailError) {
      console.error("Signup OTP email error:", mailError.message);
      return res.status(503).json({
        success: false,
        message: "Could not send verification email. Please try resending the OTP.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Signup successful. Verify your email with the OTP sent to you.",
      // Dev-only: expose the OTP so verification works even when the address can't receive mail
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === 11000) return res.status(409).json({ success: false, message: "User with this email already exists" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { signup };
