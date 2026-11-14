const mongoose = require("mongoose");
const { User, areFriends } = require("../../services/friendsService");

const getFriendProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.userId;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (!(await areFriends(userId, targetId))) {
      return res.status(403).json({ success: false, message: "You can only view your friends' profiles" });
    }

    const user = await User.findById(targetId).select("fullname email avatar address role createdAt");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get friend profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getFriendProfile };
