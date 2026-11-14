const Story = require("../../models/Story");
const mongoose = require("mongoose");

const viewStory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid story ID" });
    const story = await Story.findById(req.params.id);
    if (!story || story.expiresAt < new Date()) return res.status(404).json({ success: false, message: "Story not found" });
    if (!story.viewers.some((v) => v.toString() === req.user._id.toString())) {
      story.viewers.push(req.user._id);
      await story.save();
    }
    return res.status(200).json({ success: true, viewers: story.viewers.length });
  } catch (error) {
    console.error("View story error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteStory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid story ID" });
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    if (story.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    await story.deleteOne();
    return res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Delete story error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { viewStory, deleteStory };