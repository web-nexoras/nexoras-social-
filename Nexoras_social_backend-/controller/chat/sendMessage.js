const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const { getIO } = require("../../sockets/chatSocket");

const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;
    const { text, attachments, replyTo, forwardedFrom, attachmentType } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    }
    if (!text && (!attachments || !attachments.length)) {
      return res.status(400).json({ success: false, message: "Message text or attachment is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    const isParticipant = conversation.participants.map((p) => p.toString()).includes(userId.toString());
    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    // Group announcement-only mode: only owner/moderator can send
    const Group = require("../../models/Group");
    const group = await Group.findOne({ conversation: conversation._id });
    if (group && group.announcementOnly && conversation.type === "group") {
      const GroupMembership = require("../../models/GroupMembership");
      const mem = await GroupMembership.findOne({ group: group._id, user: userId });
      if (!mem || (mem.role !== "owner" && mem.role !== "moderator" && mem.role !== "admin")) {
        return res.status(403).json({ success: false, message: "Only admins can send messages in announcement mode" });
      }
    }

    // Muted member check
    if (group) {
      const GroupMembership = require("../../models/GroupMembership");
      const mem = await GroupMembership.findOne({ group: group._id, user: userId });
      if (mem && mem.mutedUntil && mem.mutedUntil > new Date()) {
        return res.status(403).json({ success: false, message: "You are muted in this group" });
      }
      if (mem && mem.banned) {
        return res.status(403).json({ success: false, message: "You are banned from this group" });
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text: text ? String(text).trim() : "",
      attachments: attachments || [],
      attachmentType: attachmentType || null,
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null,
      deliveredTo: [userId],
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await message.populate("sender", "fullname avatar");

    // NOTE: Chat messages deliberately do NOT create entries on the main
    // Notifications page. Unread messages are surfaced in the conversation
    // list (highlight + badge) and via the in-app message toast instead.

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message:new", populated);
    }

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { sendMessage };
