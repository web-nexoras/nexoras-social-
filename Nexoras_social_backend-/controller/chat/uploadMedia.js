const { uploadCloudinary } = require("../../helpers/utils");

const uploadMedia = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "File is required" });
    const isVoice = file.mimetype.startsWith("audio");
    const isVideo = file.mimetype.startsWith("video");
    // Audio/video must go through Cloudinary's "auto" pipeline — the default
    // image pipeline rejects them. Images keep their original behaviour.
    const url = await uploadCloudinary({
      mimetype: file.mimetype,
      imgBuffer: file.buffer,
      resourceType: isVoice || isVideo ? "auto" : "image",
    });
    const type = isVoice ? "voice" : isVideo ? "video" : file.mimetype.startsWith("image") ? "image" : "file";
    return res.status(200).json({ success: true, url, type });
  } catch (error) {
    console.error("Upload media error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { uploadMedia };