const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accept",
        "like",
        "comment",
        "reply",
        "new_post",
        "message",
        "group_invite",
        "story_like",
        "system",
      ],
      required: true,
    },
    title: { type: String, trim: true, default: "" },
    body: { type: String, trim: true, default: "" },
    data: {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "FriendRequest" },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
    },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
