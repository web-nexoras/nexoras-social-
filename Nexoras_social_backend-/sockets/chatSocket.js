const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { safeSAdd, safeSRem } = require("../helpers/redis");
const { getJwtSecret } = require("../helpers/authUtils");

const userSockets = new Map();
let ioInstance = null;

// Live call registry: callerId -> { to, conversationId, callType, startedAt, answered }.
// ONE entry per call — deleted on the first call:end, so a declined+timeout race
// can never write two chat logs for the same call.
const activeCalls = new Map();

const getIO = () => ioInstance;

const { isOriginAllowed } = require("../helpers/corsConfig");

const initChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS origin not allowed"));
        }
      },
      credentials: true,
    },
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
        socket.handshake.query?.token;

      // Support httpOnly cookie auth (browser clients)
      if (!token && socket.handshake.headers?.cookie) {
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)accTkn=([^;]+)/);
        if (match) token = decodeURIComponent(match[1]);
      }

      if (!token) return next(new Error("Authentication required"));

      const payload = jwt.verify(token, getJwtSecret());
      const user = await User.findById(payload.sub).select("fullname email avatar role isActive isVerified");
      if (!user || !user.isActive) return next(new Error("User not allowed"));

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    await safeSAdd("online:users", userId);
    io.emit("user:online", { userId });

    // Personal room — used to notify this user about conversation-level events
    socket.join(`user:${userId}`);

    // Send the current online users to this newly connected client
    socket.emit("presence:list", { onlineUserIds: Array.from(userSockets.keys()) });

    socket.on("chat:join", async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const isParticipant = conversation.participants.map((p) => p.toString()).includes(userId);
        if (!isParticipant && socket.user.role !== "admin") return;
        socket.join(`conversation:${conversationId}`);
      } catch (error) {
        console.error("chat:join error:", error.message);
      }
    });

    socket.on("message:send", async ({ conversationId, text, attachments }) => {
      try {
        if (!conversationId) return;
        if (!text && (!attachments || !attachments.length)) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const isParticipant = conversation.participants.map((p) => p.toString()).includes(userId);
        if (!isParticipant && socket.user.role !== "admin") return;

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text ? String(text).trim() : "",
          attachments: attachments || [],
        });

        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populated = await message.populate("sender", "fullname avatar");
        io.to(`conversation:${conversationId}`).emit("message:new", populated);
        // Personal rooms — participants in other chats still get the popup + unread badge
        conversation.participants.forEach((p) => {
          const pid = p.toString();
          if (pid !== userId) io.to(`user:${pid}`).emit("message:new", populated);
        });
      } catch (error) {
        console.error("message:send error:", error.message);
      }
    });

    socket.on("typing:start", ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing:start", { conversationId, userId });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing:stop", { conversationId, userId });
    });

    socket.on("message:read", async ({ conversationId, messageIds }) => {
      try {
        if (!conversationId || !Array.isArray(messageIds) || !messageIds.length) return;
        await Message.updateMany(
          { _id: { $in: messageIds }, conversation: conversationId },
          { $addToSet: { readBy: userId } }
        );
        socket.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          messageIds,
          userId,
        });
      } catch (error) {
        console.error("message:read error:", error.message);
      }
    });

    // ---- WebRTC signaling (relay to target user) ----
    socket.on("call:offer", ({ to, offer, callType, conversationId }) => {
      if (!to || !offer) return;
      console.log(`[call] offer ${userId} -> ${to}`);
      // Register the call so exactly ONE chat log can be written when it ends.
      activeCalls.set(userId, {
        to: String(to),
        conversationId: conversationId || null,
        callType: callType === "video" ? "video" : "audio",
        startedAt: Date.now(),
        answered: false,
        answeredAt: null,
      });
      io.to(`user:${to}`).emit("call:offer", { from: userId, offer, callType });
    });
    socket.on("call:answer", ({ to, answer }) => {
      if (!to || !answer) return;
      const call = activeCalls.get(String(to));
      if (call && call.to === String(userId)) {
        call.answered = true;
        call.answeredAt = Date.now();
      }
      io.to(`user:${to}`).emit("call:answer", { from: userId, answer });
    });
    socket.on("call:ice", ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(`user:${to}`).emit("call:ice", { from: userId, candidate });
    });
    socket.on("call:end", async ({ to, reason }) => {
      if (!to) return;
      io.to(`user:${to}`).emit("call:end", { from: userId, reason: reason || null });

      // ---- Single call log (server-side, once per call) ----
      // Whichever side reports the end first claims the registry entry and
      // writes the log; the other side's call:end is a no-op. This kills the
      // old "Missed + Declined" duplicate-bubble bug.
      let callerId = null;
      let call = null;
      if (activeCalls.get(String(userId))?.to === String(to)) {
        callerId = String(userId); // the caller is hanging up / timing out
        call = activeCalls.get(callerId);
      } else if (activeCalls.get(String(to))?.to === String(userId)) {
        callerId = String(to); // the callee is declining / ending
        call = activeCalls.get(callerId);
      }
      if (!call) return;
      activeCalls.delete(callerId);

      try {
        const status = call.answered
          ? "completed"
          : reason === "declined"
            ? "declined"
            : "missed";
        const durationSec = call.answered
          ? Math.max(0, Math.round((Date.now() - (call.answeredAt || call.startedAt)) / 1000))
          : 0;

        let conversationId = call.conversationId;
        if (!conversationId) {
          const otherId = callerId === String(userId) ? String(to) : String(userId);
          const conv = await Conversation.findOne({
            type: "direct",
            participants: { $all: [callerId, otherId] },
          });
          conversationId = conv?._id?.toString();
        }
        if (!conversationId) return;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: callerId,
          text: "",
          callMeta: {
            callType: call.callType,
            status,
            durationSec,
            startedAt: new Date(call.startedAt),
          },
        });
        conversation.lastMessageAt = new Date();
        await conversation.save();
        const populated = await message.populate("sender", "fullname avatar");
        io.to(`conversation:${conversationId}`).emit("message:new", populated);
        conversation.participants.forEach((p) => {
          const pid = p.toString();
          if (pid !== callerId) io.to(`user:${pid}`).emit("message:new", populated);
        });
      } catch (error) {
        console.error("call log error:", error.message);
      }
    });

    socket.on("disconnect", async () => {
      // Drop any live call this user was part of — no log for abruptly
      // closed sockets (prevents ghost "missed" logs on refresh).
      activeCalls.delete(userId);
      for (const [cid, c] of activeCalls) {
        if (c.to === userId) activeCalls.delete(cid);
      }

      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }

      if (!userSockets.has(userId)) {
        await safeSRem("online:users", userId);
        io.emit("user:offline", { userId, lastSeen: new Date() });
      }
    });
  });

  return io;
};

module.exports = { initChatSocket, getIO };
