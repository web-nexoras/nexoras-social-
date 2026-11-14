const Comment = require("../../models/Comment");
const Post = require("../../models/Post");
const mongoose = require("mongoose");
const { createNotification } = require("../../helpers/notification");

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ success: false, message: "Invalid post ID" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (!text || !String(text).trim()) return res.status(400).json({ success: false, message: "Comment text is required" });

    let parent = null;
    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) return res.status(400).json({ success: false, message: "Invalid parent ID" });
      parent = await Comment.findById(parentId);
      if (!parent || parent.post.toString() !== postId) return res.status(404).json({ success: false, message: "Parent comment not found" });
    }

    const comment = await Comment.create({
      post: postId,
      parent: parentId || null,
      author: req.user._id,
      text: String(text).trim(),
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    if (parent) await Comment.findByIdAndUpdate(parentId, { $inc: { repliesCount: 1 } });

    const populated = await comment.populate("author", "fullname avatar role");

    if (post.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        title: "New comment",
        body: `${req.user.fullname} commented on your post`,
        data: { postId: post._id, commentId: comment._id },
      });
    }
    if (parent && parent.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: parent.author,
        sender: req.user._id,
        type: "reply",
        title: "New reply",
        body: `${req.user.fullname} replied to your comment`,
        data: { postId: post._id, commentId: comment._id },
      });
    }

    return res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addComment };