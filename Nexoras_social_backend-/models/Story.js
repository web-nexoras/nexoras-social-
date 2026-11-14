const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaUrl: { type: String, required: true, trim: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    caption: { type: String, trim: true, maxlength: 300, default: "" },
    // FB-style story likes — plain list of user ids who tapped the heart
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Story", storySchema);