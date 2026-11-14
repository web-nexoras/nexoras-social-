const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], default: "direct" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    groupName: { type: String, trim: true },
    groupImage: { type: String, trim: true },
    isPremium: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessageAt: { type: Date, default: Date.now },
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Canonical key for direct conversations (sorted participant ids) to prevent duplicates.
    pairKey: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, type: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
