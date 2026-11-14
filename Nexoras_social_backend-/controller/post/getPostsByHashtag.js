const Post = require("../../models/Post");

const getPostsByHashtag = async (req, res) => {
  try {
    const tag = String(req.params.tag || "").toLowerCase().replace(/^#/, "");
    if (!tag) return res.status(400).json({ success: false, message: "Tag is required" });
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const posts = await Post.find({ hashtags: tag })
      .populate("author", "fullname avatar role")
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Get posts by hashtag error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getPostsByHashtag };