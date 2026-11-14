const express = require("express");
const router = express.Router();
const { signup } = require("../../controller/auth/signUp");
const { verifyOtp } = require("../../controller/auth/verifyOtp");
const { resendOtp } = require("../../controller/auth/resendOtp");
const { signin } = require("../../controller/auth/signIn");
const { logout } = require("../../controller/auth/logOut");
const { refreshToken } = require("../../controller/auth/refreshToken");
const { forgotPassword } = require("../../controller/auth/forgotPassword");
const { resetPassword } = require("../../controller/auth/resetPassword");
const { oauthAuth0 } = require("../../controller/auth/oauthAuth0");
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { redisRateLimit } = require("../../middlewre/redisRateLimit");
const User = require("../../models/User");
const multer = require("multer");
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

const { getProfile } = require("../../controller/auth/getProfile");
const { updateProfile } = require("../../controller/auth/updateProfile");

const authLimiter = redisRateLimit({ windowSeconds: 15 * 60, max: 30 });

router.post("/signup", authLimiter, signup);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/resend-otp", authLimiter, resendOtp);
router.post("/signin", authLimiter, signin);
router.post("/oauth", authLimiter, oauthAuth0);
router.post("/signout", logout);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, upload.single("avatar"), updateProfile);

module.exports = router;
