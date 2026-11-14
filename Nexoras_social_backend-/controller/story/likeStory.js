const mongoose = require("mongoose");
const Story = require("../../models/Story");
const { createNotification } = require("../../helpers/notification");

// ---------------- FB-style story like: tap the heart to toggle
const likeStory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid story ID" });

    const story = await Story.findById(id);
    if (!story || story.expiresAt <= new Date()) return res.status(404).json({ success: false, message: "Story not found" });

    const uid = req.user._id.toString();
    const liked = story.likes.some((l) => l.toString() === uid);

    if (liked) story.likes = story.likes.filter((l) => l.toString() !== uid);
    else story.likes.push(req.user._id);

    await story.save();

    if (!liked && story.author.toString() !== uid) {
      await createNotification({
        recipient: story.author,
        sender: req.user._id,
        type: "story_like",
        title: "Story like",
        body: `${req.user.fullname || "Someone"} liked your story`,
        data: { storyId: story._id, userId: req.user._id },
      });
    }

    return res.status(200).json({ success: true, liked: !liked, likesCount: story.likes.length });
  } catch (error) {
    console.error("Like story error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { likeStory };
