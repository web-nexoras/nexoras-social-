const Subscription = require("../../models/Subscription");
const GroupMembership = require("../../models/GroupMembership");
const Conversation = require("../../models/Conversation");
const Group = require("../../models/Group");
const { computeSubscriptionExpiry } = require("../../helpers/subscriptionDuration");

// Demo confirm — activates a pending subscription after the user picks a local
// mobile-banking method (bKash / Nagad / Rocket / Upay) on the custom payment screen.
// This skips SSLCommerz validation and is intended for demo / non-production use only.
const demoConfirm = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, message: "Demo payments are disabled in production" });
    }

    const { transactionId, method } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: "Transaction ID is required" });

    const subscription = await Subscription.findOne({ transactionId, user: req.user._id });
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

    if (subscription.status === "active") {
      return res.status(200).json({ success: true, message: "Subscription already active", subscription });
    }

    // Never let the same person end up with 2 active records for one group.
    const alreadyActive = await Subscription.findOne({
      user: subscription.user,
      group: subscription.group,
      status: "active",
      _id: { $ne: subscription._id },
    });
    if (alreadyActive) {
      await subscription.deleteOne();
      return res.status(200).json({
        success: true,
        message: "You already have an active subscription for this group",
        subscription: alreadyActive,
      });
    }

    const expiresAt = computeSubscriptionExpiry();

    subscription.status = "active";
    subscription.valId = `DEMO-${(method || "mobile").toUpperCase()}-${Date.now()}`;
    subscription.paidAt = new Date();
    subscription.expiresAt = expiresAt;
    await subscription.save();

    try {
      // Upsert (not create) so renewals refresh the expiry on an existing membership
      await GroupMembership.findOneAndUpdate(
        { group: subscription.group, user: subscription.user },
        { $set: { role: "member", premiumExpiresAt: expiresAt } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const group = await Group.findById(subscription.group);
      if (group?.conversation) {
        await Conversation.findByIdAndUpdate(group.conversation, {
          $addToSet: { participants: subscription.user },
        });
      }
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful (demo). Subscription activated.",
      method,
      subscription,
    });
  } catch (error) {
    console.error("Demo confirm error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { demoConfirm };
