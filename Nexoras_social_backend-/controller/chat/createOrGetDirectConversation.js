const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const User = require("../../models/User");
const { areFriends } = require("../../services/friendsService");

const createOrGetDirectConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.userId;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (userId.toString() === targetId) {
      return res.status(400).json({ success: false, message: "Cannot create chat with yourself" });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const isAdminTarget = target.role === "admin";
    if (!isAdminTarget && !(await areFriends(userId, targetId))) {
      return res.status(403).json({ success: false, message: "You can only chat with friends" });
    }

    const pairKey = [userId.toString(), targetId.toString()].sort().join(":");

    // Prefer the canonical pairKey lookup; fall back to the legacy participant query
    // so pre-existing conversations (without pairKey) are reused instead of duplicated.
    let conversation = await Conversation.findOne({
      type: "direct",
      pairKey,
    }).populate("participants", "fullname email avatar role");

    if (!conversation) {
      conversation = await Conversation.findOne({
        type: "direct",
        participants: { $all: [userId, targetId], $size: 2 },
      }).populate("participants", "fullname email avatar role");
      // Backfill pairKey on the legacy document so future lookups are canonical.
      if (conversation && !conversation.pairKey) {
        conversation.pairKey = pairKey;
        await conversation.save();
      }
    }

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          type: "direct",
          participants: [userId, targetId],
          createdBy: userId,
          pairKey,
        });
        conversation = await conversation.populate("participants", "fullname email avatar role");
      } catch (error) {
        // Race condition: another request created it first — fetch it.
        if (error.code === 11000) {
          conversation = await Conversation.findOne({ type: "direct", pairKey }).populate(
            "participants",
            "fullname email avatar role",
          );
          if (!conversation) {
            conversation = await Conversation.findOne({
              type: "direct",
              participants: { $all: [userId, targetId], $size: 2 },
            }).populate("participants", "fullname email avatar role");
          }
        } else {
          throw error;
        }
      }
    }

    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error("Create/get direct conversation error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createOrGetDirectConversation };
