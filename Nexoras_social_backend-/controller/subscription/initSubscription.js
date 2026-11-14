const Group = require("../../models/Group");
const Subscription = require("../../models/Subscription");
const { createPaymentSession } = require("../../services/sslPaymentService");

const initSubscription = async (req, res) => {
  try {
    const group = await Group.findById(req.body.groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // A user may only have ONE payment request in flight at a time.
    // Admin rejecting/cancelling it frees the slot again.
    const pendingRequest = await Subscription.findOne({
      user: req.user._id,
      status: "pending",
    });

    if (pendingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a payment request waiting. Admin must approve or cancel it before you can send another.",
        subscriptionId: pendingRequest._id,
        groupId: pendingRequest.group,
      });
    }

    // And never double-subscribe to the same group.
    const activeSub = await Subscription.findOne({
      user: req.user._id,
      group: group._id,
      status: "active",
    });

    if (activeSub) {
      return res.status(409).json({
        success: false,
        message: "You already have an active subscription for this group",
        subscriptionId: activeSub._id,
        expiresAt: activeSub.expiresAt,
      });
    }

    const tranId = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      store_id: process.env.SSL_STORE_ID,
      store_passwd: process.env.SSL_STORE_PASSWORD,
      total_amount: group.price,
      currency: group.currency || "BDT",
      tran_id: tranId,
      success_url: process.env.SSL_SUCCESS_URL,
      fail_url: process.env.SSL_FAIL_URL,
      cancel_url: process.env.SSL_CANCEL_URL,
      cus_name: req.user.fullname,
      cus_email: req.user.email,
      cus_add1: req.user.address || "NA",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: "01700000000",
      shipping_method: "NO",
      product_name: group.name,
      product_category: "Subscription",
      product_profile: "general",
      num_of_item: 1,
    };

    const sslRes = await createPaymentSession(payload);
    if (!sslRes || sslRes.status !== "SUCCESS") {
      return res.status(502).json({ success: false, message: "Failed to create payment session", sslRes });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      group: group._id,
      amount: group.price,
      currency: group.currency || "BDT",
      status: "pending",
      transactionId: tranId,
      gatewaySessionId: sslRes.sessionkey,
    });

    return res.status(200).json({
      success: true,
      message: "Payment session created",
      gatewayPageURL: sslRes.GatewayPageURL,
      transactionId: tranId,
      subscriptionId: subscription._id,
    });
  } catch (error) {
    console.error("Init subscription error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { initSubscription };
