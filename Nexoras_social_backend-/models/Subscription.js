const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },
    status: {
      type: String,
      enum: ["pending", "active", "failed", "cancelled", "expired"],
      default: "pending",
    },
    transactionId: { type: String, trim: true },
    gatewaySessionId: { type: String, trim: true },
    valId: { type: String, trim: true },
    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["admin", "user", "system", null], default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

subscriptionSchema.index({ user: 1, group: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
