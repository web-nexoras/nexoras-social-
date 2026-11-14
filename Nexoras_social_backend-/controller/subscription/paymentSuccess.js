const { validatePayment } = require("../../services/sslPaymentService");
const Subscription = require("../../models/Subscription");
const GroupMembership = require("../../models/GroupMembership");
const Conversation = require("../../models/Conversation");
const Group = require("../../models/Group");
const { computeSubscriptionExpiry } = require("../../helpers/subscriptionDuration");

const paymentSuccess = async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    if (!tran_id) return res.status(400).json({ success: false, message: "Transaction ID is required" });

    const subscription = await Subscription.findOne({ transactionId: tran_id });
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

    // Idempotent: a replayed success callback must not extend the expiry.
    if (subscription.status === "active") {
      return res.status(200).json({ success: true, message: "Subscription already active", subscription });
    }

    if (status && status.toUpperCase() !== "VALID") {
      subscription.status = "failed";
      await subscription.save();
      return res.status(400).json({ success: false, message: "Payment not valid" });
    }

    const validation = await validatePayment(val_id);
    if (!validation || (validation.status !== "VALID" && validation.status !== "VALIDATED")) {
      subscription.status = "failed";
      await subscription.save();
      return res.status(400).json({ success: false, message: "Payment validation failed", validation });
    }

    // Guard against a valid val_id being replayed for a different transaction/amount.
    if (validation.tran_id && validation.tran_id !== tran_id) {
      subscription.status = "failed";
      await subscription.save();
      return res.status(400).json({ success: false, message: "Transaction mismatch during validation" });
    }
    if (validation.amount !== undefined && Number(validation.amount) !== Number(subscription.amount)) {
      subscription.status = "failed";
      await subscription.save();
      return res.status(400).json({ success: false, message: "Amount mismatch during validation" });
    }
    if (validation.currency && validation.currency !== subscription.currency) {
      subscription.status = "failed";
      await subscription.save();
      return res.status(400).json({ success: false, message: "Currency mismatch during validation" });
    }

    // One person holds ONE active subscription per group — never a second record.
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
    subscription.valId = val_id;
    subscription.paidAt = new Date();
    subscription.expiresAt = expiresAt;
    await subscription.save();

    try {
      // Upsert so renewals refresh the expiry instead of failing on a duplicate key
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
      message: "Payment successful. Subscription activated.",
      subscription,
    });
  } catch (error) {
    console.error("Payment success error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { paymentSuccess };
