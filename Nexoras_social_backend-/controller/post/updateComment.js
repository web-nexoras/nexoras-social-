const Comment = require("../../models/Comment");
const mongoose = require("mongoose");

const updateComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid comment ID" });
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.isDeleted) return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });
    comment.text = text;
    await comment.save();
    const populated = await comment.populate("author", "fullname avatar role");
    return res.status(200).json({ success: true, comment: populated });
  } catch (error) {
    console.error("Update comment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { updateComment };