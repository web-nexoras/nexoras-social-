const mongoose = require("mongoose");
const User = require("../../models/User");
const { safeDel } = require("../../helpers/redis");

const toggleActive = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    await safeDel(`authuser:${user._id}`, `profile:${user._id}`);

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
      user: { _id: user._id, fullname: user.fullname, email: user.email, isActive: user.isActive },
    });
  } catch (error) {
    console.error("Toggle active error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { toggleActive };
