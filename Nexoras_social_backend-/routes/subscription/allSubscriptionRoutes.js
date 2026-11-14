const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");

const { initSubscription } = require("../../controller/subscription/initSubscription");
const { demoConfirm } = require("../../controller/subscription/demoConfirm");
const { paymentSuccess } = require("../../controller/subscription/paymentSuccess");
const { paymentFail } = require("../../controller/subscription/paymentFail");
const { paymentCancel } = require("../../controller/subscription/paymentCancel");
const { mySubscriptions, removeMySubscription } = require("../../controller/subscription/mySubscriptions");
const { adminAllSubscriptions } = require("../../controller/subscription/adminAllSubscriptions");
const { adminApproveSubscription, adminCancelSubscription } = require("../../controller/subscription/adminSubscriptionActions");
const adminOnly = require("../../middlewre/adminOnly").adminOnly;

// Public gateway callbacks
router.post("/subscription/success", paymentSuccess);
router.post("/subscription/fail", paymentFail);
router.post("/subscription/cancel", paymentCancel);

// Protected
router.post("/subscription/init", authMiddleware, checkActive, initSubscription);
router.post("/subscription/demo-confirm", authMiddleware, checkActive, demoConfirm);
router.get("/my-subscriptions", authMiddleware, checkActive, mySubscriptions);
// Subscriber clears a record out of their own list (e.g. after a rejection)
router.delete("/my-subscriptions/:id", authMiddleware, checkActive, removeMySubscription);

// Admin: full subscriber list across every group
router.get("/subscription/admin/all", authMiddleware, checkActive, adminOnly, adminAllSubscriptions);

// Admin: approve a pending subscription, or reject it (which removes it)
router.patch("/subscription/:id/approve", authMiddleware, checkActive, adminOnly, adminApproveSubscription);
router.patch("/subscription/:id/reject", authMiddleware, checkActive, adminOnly, adminCancelSubscription);

module.exports = router;
