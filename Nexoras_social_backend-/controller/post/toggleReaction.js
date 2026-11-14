const Reaction = require("../../models/Reaction");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const mongoose = require("mongoose");
const { createNotification } = require("../../helpers/notification");

const REACTION_TYPES = ["like", "love", "haha", "wow", "sad", "angry"];

const buildReactionSummary = async (targetType, targetId, userId) => {
  const agg = await Reaction.aggregate([
    { $match: { targetType, targetId: new mongoose.Types.ObjectId(targetId) } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const counts = {};
  REACTION_TYPES.forEach((t) => (counts[t] = 0));
  agg.forEach((a) => { if (counts[a._id] !== undefined) counts[a._id] = a.count; });
  const mine = await Reaction.findOne({ user: userId, targetType, targetId });
  return { counts, myReaction: mine ? mine.type : null, total: agg.reduce((s, a) => s + a.count, 0) };
};

const toggleReaction = async (req, res) => {
  try {
    const { type } = req.body;
    const targetType = req.params.targetType; // 'post' or 'comment'
    const targetId = req.params.targetId;
    if (!["post", "comment"].includes(targetType)) return res.status(400).json({ success: false, message: "Invalid target type" });
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ success: false, message: "Invalid target ID" });

    const Model = targetType === "post" ? Post : Comment;
    const target = await Model.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: "Target not found" });

    const existing = await Reaction.findOne({ user: req.user._id, targetType, targetId });
    let action = "added";
    let finalType = type || "like";
    if (existing) {
      if (type && type !== existing.type) {
        existing.type = type;
        await existing.save();
        action = "updated";
        finalType = type;
      } else {
        await existing.deleteOne();
        action = "removed";
        finalType = null;
      }
    } else {
      await Reaction.create({ user: req.user._id, targetType, targetId, type: type || "like" });
      action = "added";
      finalType = type || "like";
    }

    const summary = await buildReactionSummary(targetType, targetId, req.user._id);
    await Model.findByIdAndUpdate(targetId, { $set: { likesCount: summary.total } });

    // Notify on add (not remove)
    if (action !== "removed") {
      let recipient = null;
      let notifData = {};
      if (targetType === "post") {
        const p = await Post.findById(targetId).select("author");
        recipient = p?.author;
        notifData = { postId: targetId };
      } else {
        const c = await Comment.findById(targetId).select("author post");
        recipient = c?.author;
        notifData = { postId: c?.post, commentId: targetId };
      }
      await createNotification({
        recipient,
        sender: req.user._id,
        type: "like",
        title: "New reaction",
        body: `${req.user.fullname} reacted ${finalType} to your ${targetType}`,
        data: notifData,
      });
    }

    return res.status(200).json({ success: true, action, type: finalType, reactionCounts: summary.counts, myReaction: summary.myReaction, total: summary.total });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ success: true, action: "already" });
    console.error("Toggle reaction error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { toggleReaction };