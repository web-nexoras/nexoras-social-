const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, trim: true, maxlength: 5000, default: "" },
    attachments: [{ type: String, trim: true }],
    hashtags: [{ type: String, trim: true, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    visibility: { type: String, enum: ["public", "friends"], default: "public" },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  },
  { timestamps: true },
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);