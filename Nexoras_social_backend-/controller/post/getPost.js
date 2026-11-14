const Post = require("../../models/Post");
const mongoose = require("mongoose");

const getPost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid post ID" });
    const post = await Post.findById(req.params.id).populate("author", "fullname avatar role");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    return res.status(200).json({ success: true, post });
  } catch (error) {
    console.error("Get post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getPost };