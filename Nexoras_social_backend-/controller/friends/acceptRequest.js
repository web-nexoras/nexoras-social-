const mongoose = require("mongoose");
const { FriendRequest, createFriendshipIfNotExists } = require("../../services/friendsService");
const { createNotification } = require("../../helpers/notification");

const acceptRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    await createFriendshipIfNotExists(request.sender, request.receiver);

    request.status = "accepted";
    await request.save();

    await createNotification({
      recipient: request.sender,
      sender: req.user._id,
      type: "friend_accept",
      title: "Friend request accepted",
      body: `${req.user.fullname} accepted your friend request`,
      data: { requestId: request._id, userId: req.user._id },
    });

    return res.status(200).json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept request error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { acceptRequest };
