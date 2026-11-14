const Post = require("../../models/Post");
const mongoose = require("mongoose");
const { uploadCloudinary, destroyFromCloudinary } = require("../../helpers/utils");

// Only the author may edit their post — nobody else can.
// Supports updating text AND images (add new files, remove existing ones).
const updatePost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own posts" });
    }

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    // Images the author wants removed (must belong to this post)
    let removeImages = [];
    try {
      removeImages =
        typeof req.body?.removeImages === "string" ? JSON.parse(req.body.removeImages) : req.body?.removeImages;
    } catch {
      removeImages = [];
    }
    if (!Array.isArray(removeImages)) removeImages = [];
    const removeSet = new Set(removeImages.filter((u) => typeof u === "string"));

    const oldAttachments = post.attachments || [];
    let attachments = oldAttachments.filter((url) => !removeSet.has(url));
    for (const url of oldAttachments) {
      if (removeSet.has(url)) destroyFromCloudinary(url).catch(() => {});
    }

    // Newly uploaded images (max 5 total)
    const files = req.files || [];
    for (const f of files) {
      if (!f || !/^image\//.test(f.mimetype)) continue;
      const url = await uploadCloudinary({ mimetype: f.mimetype, imgBuffer: f.buffer });
      attachments.push(url);
    }
    if (attachments.length > 5) attachments = attachments.slice(0, 5);

    if (!text && !attachments.length && !post.sharedPost) {
      return res.status(400).json({ success: false, message: "Post cannot be empty" });
    }

    const hashtags = (text.match(/#(\w+)/g) || []).map((h) => h.slice(1).toLowerCase());
    post.text = text;
    post.attachments = attachments;
    post.hashtags = [...new Set(hashtags)];
    await post.save();

    const updated = await post.populate("author", "fullname avatar role");
    return res.status(200).json({ success: true, message: "Post updated", post: updated });
  } catch (error) {
    console.error("Update post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { updatePost };
