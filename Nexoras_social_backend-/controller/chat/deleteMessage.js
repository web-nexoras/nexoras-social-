const mongoose = require("mongoose");
const Message = require("../../models/Message");
const { getIO } = require("../../sockets/chatSocket");

const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const messageId = req.params.id;

    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages" });
    }

    const conversationId = message.conversation.toString();
    await message.deleteOne();

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message:deleted", {
        messageId,
        conversationId,
      });
    }

    return res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { deleteMessage };
