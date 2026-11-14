const { FriendRequest } = require("../../services/friendsService");

const getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    })
      .populate("receiver", "fullname email avatar role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error("Get sent requests error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSentRequests };
