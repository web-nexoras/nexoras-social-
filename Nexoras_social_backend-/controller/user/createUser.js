const userSchema = require("../../models/User");
const { isValidEmail } = require("../../helpers/authUtils");

// ---------------- Admin: create a user directly (no OTP / approval needed)
const createUser = async (req, res) => {
  const fullname = String(req.body.fullname || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const { password } = req.body;
  const role = req.body.role === "admin" ? "admin" : "user";

  try {
    if (!fullname) return res.status(400).json({ success: false, message: "Full name is required" });
    if (!email || !isValidEmail(email)) return res.status(400).json({ success: false, message: "Valid email is required" });
    if (!password || password.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });

    const existing = await userSchema.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "A user with this email already exists" });

    // Admin-created accounts are ready to use instantly
    const user = await userSchema.create({
      fullname,
      email,
      password,
      role,
      isVerified: true,
      isApproved: true,
      status: "approved",
    });

    return res.status(201).json({
      success: true,
      message: "User created",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "A user with this email already exists" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createUser };
