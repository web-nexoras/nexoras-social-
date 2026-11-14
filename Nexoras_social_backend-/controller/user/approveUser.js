const mongoose = require("mongoose");
const User = require("../../models/User");
const { safeDel } = require("../../helpers/redis");

const approveUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role !== "user") {
      return res.status(400).json({ success: false, message: "Only normal users can be approved" });
    }

    user.isApproved = true;
    user.isActive = true;
    user.status = "approved";
    await user.save();

    await safeDel(`authuser:${user._id}`, `profile:${user._id}`);

    return res.status(200).json({ success: true, message: "User approved", user });
  } catch (error) {
    console.error("Approve user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { approveUser };
