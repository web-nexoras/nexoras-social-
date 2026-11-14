const SavedPost = require("../../models/SavedPost");
const Post = require("../../models/Post");
const mongoose = require("mongoose");

const savePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid post ID" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const existing = await SavedPost.findOne({ user: req.user._id, post: post._id });
    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(post._id, { $inc: { savesCount: -1 } });
      return res.status(200).json({ success: true, saved: false });
    }
    await SavedPost.create({ user: req.user._id, post: post._id });
    await Post.findByIdAndUpdate(post._id, { $inc: { savesCount: 1 } });
    return res.status(200).json({ success: true, saved: true });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ success: true, saved: true });
    console.error("Save post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const saved = await SavedPost.find({ user: req.user._id }).populate({
      path: "post",
      populate: { path: "author", select: "fullname avatar role" },
    });
    return res.status(200).json({ success: true, posts: saved.map((s) => s.post).filter(Boolean) });
  } catch (error) {
    console.error("Get saved posts error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { savePost, getSavedPosts };