const mongoose = require("mongoose");
const User = require("../../models/User");
const { isValidEmail } = require("../../helpers/authUtils");
const { safeDel } = require("../../helpers/redis");

// ---------------- Admin: edit any user's details (name, email, role, status)
const updateUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isSelf = req.params.id === req.user._id.toString();
    const { fullname, email, role, avatar, address, isApproved, isActive } = req.body;

    if (fullname !== undefined) {
      const name = String(fullname).trim();
      if (!name) return res.status(400).json({ success: false, message: "Full name cannot be empty" });
      if (name.length > 80) return res.status(400).json({ success: false, message: "Name is too long (max 80 characters)" });
      user.fullname = name;
    }

    if (email !== undefined) {
      const mail = String(email).trim().toLowerCase();
      if (!isValidEmail(mail)) return res.status(400).json({ success: false, message: "Valid email is required" });
      if (mail !== user.email) {
        const existing = await User.findOne({ email: mail, _id: { $ne: user._id } });
        if (existing) return res.status(409).json({ success: false, message: "A user with this email already exists" });
        user.email = mail;
      }
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (address !== undefined) user.address = String(address).trim() || null;

    // Safety: admin cannot demote / deactivate their own account (avoids lockout)
    if (role !== undefined && isSelf && role !== user.role) {
      return res.status(400).json({ success: false, message: "You cannot change your own role" });
    }
    if (role !== undefined) user.role = role === "admin" ? "admin" : "user";

    if (isActive !== undefined) {
      if (isSelf && !isActive) {
        return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
      }
      user.isActive = Boolean(isActive);
    }

    if (isApproved !== undefined) {
      user.isApproved = Boolean(isApproved);
      if (user.status !== "rejected") user.status = user.isApproved ? "approved" : "pending";
      if (user.isApproved) user.isVerified = true;
    }

    await user.save();

    await safeDel(`authuser:${user._id}`, `profile:${user._id}`);

    return res.status(200).json({
      success: true,
      message: "User updated",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        address: user.address,
        isApproved: user.isApproved,
        isActive: user.isActive,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "A user with this email already exists" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { updateUser };
