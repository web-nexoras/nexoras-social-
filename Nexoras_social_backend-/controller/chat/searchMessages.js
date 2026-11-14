const mongoose = require("mongoose");
const Message = require("../../models/Message");

const searchMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const q = String(req.query.q || "").trim();
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    if (!q) return res.status(200).json({ success: true, messages: [] });
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const messages = await Message.find({
      conversation: conversationId,
      text: { $regex: escaped, $options: "i" },
    })
      .populate("sender", "fullname avatar")
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Search messages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { searchMessages };