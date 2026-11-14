const Comment = require("../../models/Comment");
const mongoose = require("mongoose");

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ success: false, message: "Invalid post ID" });
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const skip = (page - 1) * limit;
    const parentId = req.query.parentId || null;

    const filter = { post: postId, isDeleted: false };
    if (parentId) filter.parent = parentId;
    else filter.parent = null;

    const comments = await Comment.find(filter)
      .populate("author", "fullname avatar role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
    const total = await Comment.countDocuments(filter);

    return res.status(200).json({ success: true, comments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getComments };