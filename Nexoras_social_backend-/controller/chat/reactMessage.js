const mongoose = require("mongoose");
const Message = require("../../models/Message");
const { getIO } = require("../../sockets/chatSocket");

const reactMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { type } = req.body;
    if (!mongoose.isValidObjectId(messageId)) return res.status(400).json({ success: false, message: "Invalid message ID" });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    const idx = message.reactions.findIndex((r) => r.user.toString() === req.user._id.toString());
    if (idx > -1) {
      if (type && type !== message.reactions[idx].type) {
        message.reactions[idx].type = type;
      } else {
        message.reactions.splice(idx, 1);
      }
    } else {
      message.reactions.push({ user: req.user._id, type: type || "like" });
    }
    await message.save();

    // Live-sync the reaction to everyone in the conversation
    const conversationId = message.conversation.toString();
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message:reacted", {
        conversationId,
        messageId: message._id,
        reactions: message.reactions,
      });
    }

    return res.status(200).json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error("React message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const pinMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    if (!mongoose.isValidObjectId(messageId)) return res.status(400).json({ success: false, message: "Invalid message ID" });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    message.pinned = !message.pinned;
    await message.save();
    return res.status(200).json({ success: true, pinned: message.pinned });
  } catch (error) {
    console.error("Pin message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { reactMessage, pinMessage };