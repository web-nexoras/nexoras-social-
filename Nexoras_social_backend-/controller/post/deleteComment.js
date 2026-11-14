const Comment = require("../../models/Comment");
const Post = require("../../models/Post");
const mongoose = require("mongoose");

const deleteComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid comment ID" });
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    comment.isDeleted = true;
    comment.text = "[deleted]";
    await comment.save();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
    if (comment.parent) await Comment.findByIdAndUpdate(comment.parent, { $inc: { repliesCount: -1 } });
    return res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { deleteComment };