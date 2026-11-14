const mongoose = require("mongoose");

const groupMembershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["owner", "moderator", "member", "muted", "banned"], default: "member" },
    mutedUntil: { type: Date, default: null },
    banned: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    premiumExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

groupMembershipSchema.index({ group: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("GroupMembership", groupMembershipSchema);
