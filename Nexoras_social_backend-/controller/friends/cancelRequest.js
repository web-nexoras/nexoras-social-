const mongoose = require("mongoose");
const { FriendRequest } = require("../../services/friendsService");

const cancelRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    if (request.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    request.status = "cancelled";
    await request.save();

    return res.status(200).json({ success: true, message: "Friend request cancelled" });
  } catch (error) {
    console.error("Cancel request error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { cancelRequest };
