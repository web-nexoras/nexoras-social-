const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const Reaction = require("../../models/Reaction");
const SavedPost = require("../../models/SavedPost");
const mongoose = require("mongoose");
const { destroyFromCloudinary } = require("../../helpers/utils");

const deletePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid post ID" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    for (const url of post.attachments || []) {
      destroyFromCloudinary(url).catch(() => {});
    }
    await Comment.deleteMany({ post: post._id });
    await Reaction.deleteMany({ targetType: "post", targetId: post._id });
    await SavedPost.deleteMany({ post: post._id });
    await post.deleteOne();
    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { deletePost };