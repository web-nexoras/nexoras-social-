const mongoose = require("mongoose");
const { User, FriendRequest, areFriends } = require("../../services/friendsService");
const { createNotification } = require("../../helpers/notification");

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.userId;

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (senderId.toString() === receiverId) {
      return res.status(400).json({ success: false, message: "You cannot add yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: "User not found" });
    if (!receiver.isVerified || !receiver.isActive) {
      return res.status(400).json({ success: false, message: "This user is not available" });
    }

    if (await areFriends(senderId, receiverId)) {
      return res.status(409).json({ success: false, message: "You are already friends" });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(409).json({ success: false, message: "Friend request already pending" });
      }
      existing.sender = senderId;
      existing.receiver = receiverId;
      existing.status = "pending";
      await existing.save();
      return res.status(200).json({ success: true, message: "Friend request sent", request: existing });
    }

    const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: "friend_request",
      title: "New friend request",
      body: `${req.user.fullname} sent you a friend request`,
      data: { requestId: request._id, userId: senderId },
    });
    return res.status(201).json({ success: true, message: "Friend request sent", request });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Friend request already exists" });
    }
    console.error("Send friend request error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { sendFriendRequest };
