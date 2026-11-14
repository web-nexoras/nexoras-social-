const Post = require("../../models/Post");
const Friendship = require("../../models/Friendship");
const { createNotification } = require("../../helpers/notification");
const { uploadCloudinary } = require("../../helpers/utils");

const createPost = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    const files = req.files || (req.file ? [req.file] : []);

    const sharedPostId = req.body.sharedPostId;
    if (!text && !files.length && !sharedPostId) {
      return res.status(400).json({ success: false, message: "Text or image is required" });
    }

    const hashtags = (text.match(/#(\w+)/g) || []).map((h) => h.slice(1).toLowerCase());
    // mentions resolved loosely by username not implemented; store raw not needed

    const attachments = [];
    for (const f of files) {
      const url = await uploadCloudinary({ mimetype: f.mimetype, imgBuffer: f.buffer });
      attachments.push(url);
    }

    const post = await Post.create({
      author: req.user._id,
      text,
      attachments,
      hashtags: [...new Set(hashtags)],
      visibility: req.body.visibility === "friends" ? "friends" : "public",
      sharedPost: sharedPostId || null,
    });

    const populated = await post.populate("author", "fullname avatar role");

    // Tell the author's friends about the new post (feed activity notification).
    // Best-effort: a failure here must never break posting.
    try {
      const uid = req.user._id.toString();
      const friendships = await Friendship.find({
        $or: [{ userA: uid }, { userB: uid }],
      })
        .select("userA userB")
        .lean();

      const friendIds = friendships.map((f) =>
        f.userA.toString() === uid ? f.userB : f.userA,
      );

      await Promise.all(
        friendIds.map((friendId) =>
          createNotification({
            recipient: friendId,
            sender: req.user._id,
            type: "new_post",
            title: "New post",
            body: `${req.user.fullname} added a new post`,
            data: { postId: post._id, userId: req.user._id },
          }),
        ),
      );
    } catch (notifyError) {
      console.error("New post notification error:", notifyError.message);
    }

    return res.status(201).json({ success: true, post: populated });
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createPost };