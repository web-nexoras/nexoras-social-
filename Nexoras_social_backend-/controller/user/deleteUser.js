const mongoose = require("mongoose");
const User = require("../../models/User");
const FriendRequest = require("../../models/FriendRequest");
const Friendship = require("../../models/Friendship");
const Subscription = require("../../models/Subscription");
const GroupMembership = require("../../models/GroupMembership");
const Conversation = require("../../models/Conversation");
const { safeDel } = require("../../helpers/redis");

const deleteUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userId = user._id;
    await FriendRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Friendship.deleteMany({ $or: [{ userA: userId }, { userB: userId }] });
    await Subscription.deleteMany({ user: userId });
    await GroupMembership.deleteMany({ user: userId });
    await Conversation.updateMany({ participants: userId }, { $pull: { participants: userId } });
    await safeDel(`authuser:${userId}`, `profile:${userId}`);

    await user.deleteOne();
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { deleteUser };
