const Reaction = require("../../models/Reaction");
const mongoose = require("mongoose");

const getReactions = async (req, res) => {
  try {
    const targetId = req.params.targetId;
    const targetType = req.params.targetType || "post";
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const reactions = await Reaction.find({ targetType, targetId })
      .populate("user", "fullname avatar role")
      .sort({ createdAt: -1 });
    const grouped = {};
    reactions.forEach((r) => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r.user);
    });
    return res.status(200).json({ success: true, grouped, total: reactions.length });
  } catch (error) {
    console.error("Get reactions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getReactions };