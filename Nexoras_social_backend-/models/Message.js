const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 4000, default: "" },
    editedAt: { type: Date, default: null },
    attachments: [{ type: String, trim: true }],
    attachmentType: { type: String, enum: ["image", "file", "voice", "video", null], default: null },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    reactions: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, type: { type: String, default: "like" } }],
    pinned: { type: Boolean, default: false },
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Call-history bubble in the conversation (video/voice call log)
    callMeta: {
      callType: { type: String, enum: ["audio", "video", null], default: null },
      status: { type: String, enum: ["completed", "missed", "declined", "cancelled", null], default: null },
      durationSec: { type: Number, default: 0 },
      startedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, pinned: 1 });

module.exports = mongoose.model("Message", messageSchema);