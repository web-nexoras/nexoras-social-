const mongoose = require("mongoose");
const Message = require("../../models/Message");
const { getIO } = require("../../sockets/chatSocket");

const updateMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const messageId = req.params.id;
    const text = String(req.body.text ?? "").trim();

    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message ID" });
    }
    if (!text) return res.status(400).json({ success: false, message: "Message text is required" });
    if (text.length > 2000) {
      return res.status(400).json({ success: false, message: "Message is too long (max 2000 characters)" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Only the author (or an admin) may edit a message
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages" });
    }

    message.text = text;
    message.editedAt = new Date();
    await message.save();

    const conversationId = message.conversation.toString();
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message:updated", {
        conversationId,
        message: {
          _id: message._id,
          text: message.text,
          editedAt: message.editedAt,
          sender: message.sender,
          conversation: message.conversation,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: { _id: message._id, text: message.text, editedAt: message.editedAt },
    });
  } catch (error) {
    console.error("Update message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { updateMessage };
