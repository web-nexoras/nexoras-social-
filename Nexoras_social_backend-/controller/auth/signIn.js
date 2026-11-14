const userSchema = require("../../models/User");
const { generateAccessToken, generateRefreshToken, hashToken } = require("../../helpers/authUtils");
const { safeSet } = require("../../helpers/redis");

// ---------------- Signin Controller
const signin = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { password } = req.body;

  try {
    // -------- Validate input
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

    // -------- Find user and compare password
    const user = await userSchema.findOne({ email }).select("+password +refreshTokenHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // -------- Check verification and approval (admins always sign in directly)
    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      if (!user.isVerified) return res.status(403).json({ success: false, message: "Please verify your email first" });
      const approvalStatus = user.status || (user.isApproved ? "approved" : "pending");
      if (approvalStatus === "rejected") {
        return res.status(403).json({ success: false, message: "Your account was rejected by the admin. Contact support for help." });
      }
      if (approvalStatus !== "approved" || !user.isApproved) {
        return res.status(403).json({ success: false, message: "Your account is waiting for admin approval. You can log in once approved." });
      }
    }

    // -------- Generate and store tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Cache sanitized user in Redis for fast protected-route access (best-effort)
    const cachedUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      address: user.address,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      isActive: user.isActive,
    };
    await safeSet(`authuser:${user._id}`, JSON.stringify(cachedUser), { EX: 60 });

    // -------- Send auth cookies
    const { getCookieOptions } = require("../../helpers/cookieOptions");
    const cookieOptions = getCookieOptions();
    return res
      .status(200)
      .cookie("accTkn", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie("refTkn", refreshToken, { ...cookieOptions, maxAge: 15 * 24 * 60 * 60 * 1000 })
      .json({
        success: true,
        message: "Signin successful",
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          address: user.address,
          isVerified: user.isVerified,
          isApproved: user.isApproved,
          isActive: user.isActive,
        },
      });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { signin };
