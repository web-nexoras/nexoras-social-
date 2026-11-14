const mongoose = require("mongoose");
const Follow = require("../../models/Follow");
const User = require("../../models/User");

const followUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ success: false, message: "Invalid user ID" });
    if (targetId === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (existing) return res.status(200).json({ success: true, following: true, message: "Already following" });

    await Follow.create({ follower: req.user._id, following: targetId });
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });
    return res.status(200).json({ success: true, following: true });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ success: true, following: true });
    console.error("Follow user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ success: false, message: "Invalid user ID" });
    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (!existing) return res.status(200).json({ success: true, following: false, message: "Not following" });
    await existing.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
    return res.status(200).json({ success: true, following: false });
  } catch (error) {
    console.error("Unfollow user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const isFollowing = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const f = await Follow.findOne({ follower: req.user._id, following: targetId });
    return res.status(200).json({ success: true, following: !!f });
  } catch (error) {
    console.error("Is following error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getFollowers = async (req, res) => {
  try {
    const targetId = req.params.userId || req.user._id;
    const follows = await Follow.find({ following: targetId }).populate("follower", "fullname avatar role followersCount");
    return res.status(200).json({ success: true, users: follows.map((f) => f.follower) });
  } catch (error) {
    console.error("Get followers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const targetId = req.params.userId || req.user._id;
    const follows = await Follow.find({ follower: targetId }).populate("following", "fullname avatar role followersCount");
    return res.status(200).json({ success: true, users: follows.map((f) => f.following) });
  } catch (error) {
    console.error("Get following error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { followUser, unfollowUser, isFollowing, getFollowers, getFollowing };