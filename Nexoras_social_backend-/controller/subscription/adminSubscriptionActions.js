const mongoose = require("mongoose");
const Subscription = require("../../models/Subscription");
const GroupMembership = require("../../models/GroupMembership");
const Conversation = require("../../models/Conversation");
const Group = require("../../models/Group");
const { computeSubscriptionExpiry } = require("../../helpers/subscriptionDuration");

// Admin-only: manually approve a pending subscription (e.g. offline / cash payments
// made outside the gateway) and grant 6 months of group access.
const adminApproveSubscription = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

    if (subscription.status === "active") {
      return res.status(200).json({ success: true, message: "Subscription already active", subscription });
    }

    // One person holds ONE active subscription per group — approving this one
    // would duplicate access that already exists.
    const alreadyActive = await Subscription.findOne({
      user: subscription.user,
      group: subscription.group,
      status: "active",
      _id: { $ne: subscription._id },
    });

    if (alreadyActive) {
      return res.status(400).json({
        success: false,
        message: "This user already has an active subscription for this group. Reject this request instead.",
        activeSubscriptionId: alreadyActive._id,
        expiresAt: alreadyActive.expiresAt,
      });
    }

    const expiresAt = computeSubscriptionExpiry();
    subscription.status = "active";
    subscription.paidAt = subscription.paidAt || new Date();
    subscription.expiresAt = expiresAt;
    if (!subscription.valId) subscription.valId = `ADMIN-APPROVED-${Date.now()}`;
    await subscription.save();

    try {
      // Upsert (not create) so renewals / admin approvals refresh the expiry
      // instead of silently failing on an existing membership.
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

    return res.status(200).json({ success: true, message: "Subscription approved", subscription });
  } catch (error) {
    console.error("Admin approve subscription error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin-only: reject an abandoned / unpaid pending subscription.
// It disappears from the admin's list, and the subscriber sees
// "cancelled by admin" (and can remove it themselves).
const adminCancelSubscription = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

    if (subscription.status === "active") {
      return res.status(400).json({ success: false, message: "Active subscriptions cannot be rejected" });
    }

    subscription.status = "cancelled";
    subscription.cancelledBy = "admin";
    subscription.cancelledAt = new Date();
    await subscription.save();

    return res.status(200).json({ success: true, message: "Subscription rejected", subscription });
  } catch (error) {
    console.error("Admin reject subscription error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { adminApproveSubscription, adminCancelSubscription };
