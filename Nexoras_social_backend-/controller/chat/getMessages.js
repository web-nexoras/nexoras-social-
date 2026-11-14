const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");

const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });
    const isParticipant = conversation.participants.map((p) => p.toString()).includes(userId.toString());
    // Participants (private) — admin may view for moderation only
    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "fullname avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark delivered for this user
    await Message.updateMany(
      { _id: { $in: messages.map((m) => m._id) }, sender: { $ne: userId } },
      { $addToSet: { deliveredTo: userId } },
    );

    const total = await Message.countDocuments({ conversation: conversationId });

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getMessages };
