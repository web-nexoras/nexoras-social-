const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");
const Subscription = require("../../models/Subscription");
const { getIO } = require("../../sockets/chatSocket");

// Delete a whole conversation and every message inside it.
// Admin can delete any conversation; a participant can delete their own.
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

    const isAdmin = req.user.role === "admin";
    const isParticipant = conversation.participants.map((p) => p.toString()).includes(userId.toString());
    if (!isAdmin && !isParticipant) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    // If this conversation backs a group, remove the group too so nothing is orphaned
    const group = await Group.findOne({ conversation: conversation._id });
    if (group) {
      // Group-backed conversations carry premium memberships; only admins may tear them down.
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: "Only admins can delete a group conversation" });
      }
      await GroupMembership.deleteMany({ group: group._id });
      await Subscription.deleteMany({ group: group._id });
      await group.deleteOne();
    }

    await Message.deleteMany({ conversation: conversation._id });
    await conversation.deleteOne();

    // Tell every participant so their chat list updates live
    const io = getIO();
    if (io) {
      for (const p of conversation.participants) {
        io.to(`user:${p.toString()}`).emit("conversation:deleted", {
          conversationId,
          groupId: group ? group._id : null,
        });
      }
    }

    return res.status(200).json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { deleteConversation };
