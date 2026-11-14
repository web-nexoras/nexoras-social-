const Post = require("../../models/Post");
const Friendship = require("../../models/Friendship");
const Follow = require("../../models/Follow");

const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);

    const friendships = await Friendship.find({ $or: [{ userA: userId }, { userB: userId }] });
    const friendIds = friendships.map((f) =>
      f.userA.toString() === userId.toString() ? f.userB : f.userA,
    );
    const follows = await Follow.find({ follower: userId }).select("following");
    const followedIds = follows.map((f) => f.following);

    const authorIds = [...new Set([userId.toString(), ...friendIds.map(String), ...followedIds.map(String)])];

    const filter = {
      author: { $in: authorIds },
      $or: [
        { visibility: "public" },
        { author: userId },
        { author: { $in: friendIds }, visibility: "friends" },
      ],
    };
    if (req.query.cursor) {
      filter.createdAt = { $lt: new Date(req.query.cursor) };
    }

    const posts = await Post.find(filter)
      .populate("author", "fullname avatar role")
      .populate({ path: "sharedPost", populate: { path: "author", select: "fullname avatar role" } })
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    let items = hasMore ? posts.slice(0, limit) : posts;
    let moreAvailable = hasMore;

    // A brand-new or quiet account would otherwise stare at an empty feed.
    // Fall back to the admins' public posts ("Nexora team" content).
    if (!items.length && !req.query.cursor) {
      const candidates = await Post.find({ visibility: "public" })
        .populate("author", "fullname avatar role")
        .populate({ path: "sharedPost", populate: { path: "author", select: "fullname avatar role" } })
        .sort({ createdAt: -1 })
        .limit(limit * 4);
      const adminPosts = candidates.filter((p) => p.author?.role === "admin").slice(0, limit);
      if (adminPosts.length) {
        items = adminPosts;
        moreAvailable = false;
      }
    }

    // Attach reaction summary for each post
    const Reaction = require("../../models/Reaction");
    const postIds = items.map((p) => p._id);
    const agg = await Reaction.aggregate([
      { $match: { targetType: "post", targetId: { $in: postIds } } },
      { $group: { _id: { post: "$targetId", type: "$type" }, count: { $sum: 1 } } },
    ]);
    const myReactions = await Reaction.find({ user: userId, targetType: "post", targetId: { $in: postIds } });
    const myMap = new Map(myReactions.map((r) => [String(r.targetId), r.type]));
    const countsMap = new Map();
    agg.forEach((a) => {
      const pid = String(a._id.post);
      if (!countsMap.has(pid)) countsMap.set(pid, {});
      countsMap.get(pid)[a._id.type] = a.count;
    });

    const enriched = items.map((p) => {
      const obj = p.toObject();
      const counts = countsMap.get(String(p._id)) || {};
      const REACTION_TYPES = ["like", "love", "haha", "wow", "sad", "angry"];
      const reactionCounts = {};
      REACTION_TYPES.forEach((t) => (reactionCounts[t] = counts[t] || 0));
      obj.reactionCounts = reactionCounts;
      obj.myReaction = myMap.get(String(p._id)) || null;
      return obj;
    });

    const nextCursor = moreAvailable ? items[items.length - 1].createdAt.toISOString() : null;

    return res.status(200).json({ success: true, posts: enriched, nextCursor, hasMore: moreAvailable });
  } catch (error) {
    console.error("Get feed error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getFeed };