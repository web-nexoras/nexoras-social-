const Post = require("../../models/Post");
const mongoose = require("mongoose");

const sharePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid post ID" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    await Post.findByIdAndUpdate(post._id, { $inc: { sharesCount: 1 } });
    return res.status(200).json({ success: true, message: "Post shared" });
  } catch (error) {
    console.error("Share post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { sharePost };