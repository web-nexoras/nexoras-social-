const Notification = require("../../models/Notification");
const mongoose = require("mongoose");

// The main Notifications page is for feed activity and friend requests only.
// Chat messages are surfaced in the conversation list instead, so any legacy
// `message` notifications are excluded here (and from the unread badge).
const MAIN_NOTIFICATION_FILTER = { type: { $ne: "message" } };

const getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const skip = (page - 1) * limit;
    const filter = { ...MAIN_NOTIFICATION_FILTER, recipient: req.user._id };
    if (req.query.unread === "true") filter.read = false;

    const notifications = await Notification.find(filter)
      .populate("sender", "fullname avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      ...MAIN_NOTIFICATION_FILTER,
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({ success: true, notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      ...MAIN_NOTIFICATION_FILTER,
      recipient: req.user._id,
      read: false,
    });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Unread count error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const markAsRead = async (req, res) => {
  try {
    if (req.params.id === "all") {
      await Notification.updateMany(
        { ...MAIN_NOTIFICATION_FILTER, recipient: req.user._id, read: false },
        { $set: { read: true } },
      );
      return res.status(200).json({ success: true, message: "All marked as read" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const notif = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    notif.read = true;
    await notif.save();
    return res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead };