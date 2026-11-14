const mongoose = require("mongoose");
const User = require("../../models/User");
const { safeDel } = require("../../helpers/redis");

const rejectUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isApproved = false;
    user.isActive = false;
    user.status = "rejected";
    await user.save();

    await safeDel(`authuser:${user._id}`, `profile:${user._id}`);

    return res.status(200).json({ success: true, message: "User rejected", user });
  } catch (error) {
    console.error("Reject user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { rejectUser };
