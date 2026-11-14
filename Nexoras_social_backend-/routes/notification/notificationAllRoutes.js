const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");
const { getNotifications, getUnreadCount, markAsRead } = require("../../controller/notification/notificationController");

router.use(authMiddleware, checkActive);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);

module.exports = router;