const Story = require("../../models/Story");
const Friendship = require("../../models/Friendship");
const Follow = require("../../models/Follow");

const getStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendships = await Friendship.find({ $or: [{ userA: userId }, { userB: userId }] });
    const friendIds = friendships.map((f) => (f.userA.toString() === userId.toString() ? f.userB : f.userA));
    const follows = await Follow.find({ follower: userId }).select("following");
    const followedIds = follows.map((f) => f.following);
    const authorIds = [...new Set([userId.toString(), ...friendIds.map(String), ...followedIds.map(String)])];

    const stories = await Story.find({ author: { $in: authorIds }, expiresAt: { $gt: new Date() } })
      .populate("author", "fullname avatar role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, stories });
  } catch (error) {
    console.error("Get stories error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getStories };