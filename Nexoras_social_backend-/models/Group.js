const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true },
    isPremium: { type: Boolean, default: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
    announcementOnly: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Group", groupSchema);
