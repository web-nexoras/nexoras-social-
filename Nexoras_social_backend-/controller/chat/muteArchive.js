const mongoose = require("mongoose");
const Conversation = require("../../models/Conversation");

const toggleMute = async (req, res) => {
  try {
    const conversationId = req.params.id;
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found" });
    const idx = conv.mutedBy.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx > -1) conv.mutedBy.splice(idx, 1);
    else conv.mutedBy.push(req.user._id);
    await conv.save();
    return res.status(200).json({ success: true, muted: idx === -1 });
  } catch (error) {
    console.error("Toggle mute error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleArchive = async (req, res) => {
  try {
    const conversationId = req.params.id;
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ success: false, message: "Conversation not found" });
    const idx = conv.archivedBy.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx > -1) conv.archivedBy.splice(idx, 1);
    else conv.archivedBy.push(req.user._id);
    await conv.save();
    return res.status(200).json({ success: true, archived: idx === -1 });
  } catch (error) {
    console.error("Toggle archive error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { toggleMute, toggleArchive };