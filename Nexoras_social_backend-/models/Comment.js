const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, trim: true, maxlength: 2000, required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, parent: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);