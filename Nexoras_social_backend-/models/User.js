const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    avatar: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    // Approval workflow: pending → approved | rejected (admin decides)
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: true },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokenHash: { type: String, select: false },
    // Linked social identities (e.g. google-oauth2 / github). One account can
    // have more than one provider; identity is matched by verified email.
    oauthProviders: [
      {
        _id: false,
        provider: { type: String, trim: true },
        providerId: { type: String, trim: true },
        linkedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
