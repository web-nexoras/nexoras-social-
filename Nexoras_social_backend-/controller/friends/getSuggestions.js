const { areFriends } = require("../../services/friendsService");
const { User, FriendRequest, Friendship } = require("../../services/friendsService");

const getSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friendship.find({
      $or: [{ userA: userId }, { userB: userId }],
    });
    const friendIds = friendships.map((f) =>
      f.userA.toString() === userId.toString() ? f.userB : f.userA
    );

    const pending = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "pending",
    });
    const pendingIds = pending.map((r) =>
      r.sender.toString() === userId.toString() ? r.receiver : r.sender
    );

    const exclude = [userId, ...friendIds, ...pendingIds];

    const filter = {
      _id: { $nin: exclude },
      isVerified: true,
      isActive: true,
    };

    if (req.query.search) {
      const q = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { fullname: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter, { fullname: 1, email: 1, avatar: 1, role: 1 }).limit(50);

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("Get suggestions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSuggestions };
