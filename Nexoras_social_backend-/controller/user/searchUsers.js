const User = require("../../models/User");
const { FriendRequest, Friendship } = require("../../services/friendsService");

const searchUsers = async (req, res) => {
  try {
    const me = req.user._id;
    const rawQ = String(req.query.q || "").trim();
    const q = rawQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (!q) {
      return res.status(200).json({ success: true, count: 0, users: [] });
    }

    const users = await User.find({
      _id: { $ne: me },
      isVerified: true,
      isActive: true,
      $or: [
        { fullname: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("fullname email avatar role")
      .limit(10)
      .lean();

    const ids = users.map((u) => u._id);

    const friendships = await Friendship.find({
      $or: [
        { userA: me, userB: { $in: ids } },
        { userB: me, userA: { $in: ids } },
      ],
    }).lean();
    const friendIds = new Set(
      friendships.map((f) =>
        (f.userA.toString() === me.toString() ? f.userB : f.userA).toString()
      )
    );

    const pending = await FriendRequest.find({
      status: "pending",
      $or: [
        { sender: me, receiver: { $in: ids } },
        { receiver: me, sender: { $in: ids } },
      ],
    }).lean();
    const sentIds = new Set();
    const receivedIds = new Set();
    pending.forEach((r) => {
      if (r.sender.toString() === me.toString()) sentIds.add(r.receiver.toString());
      else receivedIds.add(r.sender.toString());
    });

    const results = users.map((u) => ({
      ...u,
      isFriend: friendIds.has(u._id.toString()),
      requestSent: sentIds.has(u._id.toString()),
      requestReceived: receivedIds.has(u._id.toString()),
    }));

    return res.status(200).json({ success: true, count: results.length, users: results });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { searchUsers };
