const mongoose = require("mongoose");
const Subscription = require("../../models/Subscription");

// Admin-only: every subscription across all groups, so the admin can see
// exactly who has paid, for which group, and when the 6-month access expires.
const adminAllSubscriptions = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { status, group } = req.query;
    const filter = {};
    if (status) filter.status = status;
    // Rejected ones are hidden from the admin list by default (the subscriber
    // still sees them and can remove the record themselves).
    else filter.status = { $ne: "cancelled" };
    if (group && mongoose.isValidObjectId(group)) filter.group = group;

    const subscriptions = await Subscription.find(filter)
      .populate("user", "fullname email avatar role")
      .populate("group", "name currency price description")
      .sort({ createdAt: -1 })
      .limit(500);

    const now = new Date();
    const data = subscriptions.map((s) => ({
      _id: s._id,
      status: s.status,
      amount: s.amount,
      currency: s.currency,
      transactionId: s.transactionId,
      valId: s.valId,
      paidAt: s.paidAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      isExpired: s.expiresAt ? s.expiresAt < now : s.status === "expired",
      user: s.user || null,
      group: s.group || null,
    }));

    return res
      .status(200)
      .json({ success: true, count: data.length, subscriptions: data });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { adminAllSubscriptions };
