const { Friendship } = require("../../services/friendsService");

const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendships = await Friendship.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "fullname email avatar role")
      .populate("userB", "fullname email avatar role")
      .sort({ createdAt: -1 });

    const friends = friendships
      .map((f) => {
        if (!f.userA || !f.userB) return null;
        const other = f.userA._id.toString() === userId.toString() ? f.userB : f.userA;
        if (!other) return null;
        return { friendshipId: f._id, friend: other, since: f.createdAt };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, count: friends.length, friends });
  } catch (error) {
    console.error("Get friends error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getFriends };
