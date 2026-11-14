const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");

const markConversationRead = async (req, res) => {
  try {
    const conversationId = req.params.id;
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    const isParticipant = conversation.participants.map((p) => p.toString()).includes(req.user._id.toString());
    if (!isParticipant && req.user.role !== "admin") return res.status(403).json({ success: false, message: "Not allowed" });

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } },
    );
    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { markConversationRead };