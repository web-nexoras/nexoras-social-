const Story = require("../../models/Story");
const { uploadCloudinary } = require("../../helpers/utils");

const createStory = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "Media file is required" });
    const url = await uploadCloudinary({ mimetype: file.mimetype, imgBuffer: file.buffer });
    const mediaType = file.mimetype.startsWith("video") ? "video" : "image";
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await Story.create({
      author: req.user._id,
      mediaUrl: url,
      mediaType,
      caption: req.body.caption ? String(req.body.caption).trim() : "",
      expiresAt,
    });
    const populated = await story.populate("author", "fullname avatar role");
    return res.status(201).json({ success: true, story: populated });
  } catch (error) {
    console.error("Create story error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createStory };