const Notification = require("../models/Notification");

const createNotification = async ({ recipient, sender, type, title, body, data }) => {
  if (!recipient) return null;
  if (sender && String(recipient) === String(sender)) return null; // no self-notify
  try {
    const notif = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title: title || "",
      body: body || "",
      data: data || {},
    });
    // Real-time push via socket (best-effort)
    try {
      const { getIO } = require("../sockets/chatSocket");
      const io = getIO();
      if (io) {
        io.to(`user:${String(recipient)}`).emit("notification:new", notif);
      }
    } catch (e) {
      // ignore
    }
    return notif;
  } catch (error) {
    console.error("Create notification error:", error.message);
    return null;
  }
};

module.exports = { createNotification };