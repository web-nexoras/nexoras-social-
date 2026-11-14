const Subscription = require("../../models/Subscription");

const paymentCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (!tran_id) return res.status(400).json({ success: false, message: "Transaction ID is required" });

    const subscription = await Subscription.findOne({ transactionId: tran_id });
    // Never downgrade an already-active subscription via a (possibly replayed) cancel callback.
    if (subscription && subscription.status === "pending") {
      subscription.status = "cancelled";
      await subscription.save();
    }

    return res.status(200).json({ success: false, message: "Payment cancelled" });
  } catch (error) {
    console.error("Payment cancel error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { paymentCancel };
