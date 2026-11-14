const mongoose = require("mongoose");
const Story = require("../../models/Story");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");

// ---------------- FB-style story comment:
// Replying to a story drops straight into the DIRECT CHAT with the story's
// author — the message carries the story media as an attachment (so the
// other side sees "what you replied to") plus the comment text, exactly
// like commenting on a friend's story in Facebook Messenger.
const commentStory = async (req, res) => {
  try {
    const { id } = req.params;
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid story ID" });

    const story = await Story.findById(id).populate("author", "fullname avatar");
    if (!story || story.expiresAt <= new Date()) return res.status(404).json({ success: false, message: "Story not found" });

    const authorId = story.author?._id?.toString();
    const meId = req.user._id.toString();
    if (authorId === meId) return res.status(400).json({ success: false, message: "You cannot comment on your own story" });

    // Find (or create) the canonical direct conversation — same pairKey
    // scheme the chat system uses, so no duplicate conversations.
    const pairKey = [meId, authorId].sort().join(":");
    let conversation = await Conversation.findOne({ type: "direct", pairKey });
    if (!conversation) {
      conversation = await Conversation.findOne({ type: "direct", participants: { $all: [meId, authorId] } });
    }
    if (!conversation) {
      conversation = await Conversation.create({ type: "direct", participants: [meId, authorId], pairKey });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      attachments: [story.mediaUrl],
      attachmentType: story.mediaType === "video" ? "video" : "image",
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await message.populate("sender", "fullname avatar");

    // Real-time push — same events the normal chat flow uses, so the
    // story author instantly sees the comment in their Messages.
    try {
      const { getIO } = require("../../sockets/chatSocket");
      const io = getIO();
      if (io) {
        io.to(`conversation:${conversation._id}`).emit("message:new", populated);
        io.to(`user:${authorId}`).emit("message:new", populated);
      }
    } catch (e) {
      // socket push is best-effort; the message is already saved
    }

    return res.status(201).json({ success: true, message: "Comment sent", conversationId: conversation._id });
  } catch (error) {
    console.error("Comment story error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { commentStory };
