const mongoose = require("mongoose");
const Subscription = require("../../models/Subscription");

const mySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .populate("group", "name description image price currency")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: subscriptions.length, subscriptions });
  } catch (error) {
    console.error("My subscriptions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Owner-only: the subscriber removes a record themselves — used after an admin
// rejection so they can clear "cancelled by admin" out of their list.
const removeMySubscription = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) return res.status(404).json({ success: false, message: "Subscription not found" });

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your subscription" });
    }

    if (subscription.status === "active") {
      return res.status(400).json({ success: false, message: "Active subscription cannot be removed" });
    }

    await subscription.deleteOne();
    return res.status(200).json({ success: true, message: "Subscription removed" });
  } catch (error) {
    console.error("Remove subscription error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { mySubscriptions, removeMySubscription };
