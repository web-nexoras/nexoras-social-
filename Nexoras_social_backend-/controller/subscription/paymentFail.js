const Subscription = require("../../models/Subscription");

const paymentFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (!tran_id) return res.status(400).json({ success: false, message: "Transaction ID is required" });

    const subscription = await Subscription.findOne({ transactionId: tran_id });
    // Never downgrade an already-active subscription via a (possibly replayed) fail callback.
    if (subscription && subscription.status === "pending") {
      subscription.status = "failed";
      await subscription.save();
    }

    return res.status(200).json({ success: false, message: "Payment failed" });
  } catch (error) {
    console.error("Payment fail error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { paymentFail };
