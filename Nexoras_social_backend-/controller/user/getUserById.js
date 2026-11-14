const mongoose = require("mongoose");
const User = require("../../models/User");
const { FriendRequest, Friendship } = require("../../services/friendsService");

const getUserById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const me = req.user._id;
    const isSelf = user._id.toString() === me.toString();

    if (isSelf) {
      return res.status(200).json({ success: true, user, isSelf: true });
    }

    const friendship = await Friendship.findOne({
      $or: [
        { userA: me, userB: user._id },
        { userB: me, userA: user._id },
      ],
    });
    const request = await FriendRequest.findOne({
      status: "pending",
      $or: [
        { sender: me, receiver: user._id },
        { receiver: me, sender: user._id },
      ],
    });

    const relationship = {
      isFriend: !!friendship,
      requestSent: !!(request && request.sender.toString() === me.toString()),
      requestReceived: !!(request && request.receiver.toString() === me.toString()),
    };

    return res.status(200).json({ success: true, user, isSelf: false, relationship });
  } catch (error) {
    console.error("Get user by id error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getUserById };
