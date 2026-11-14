const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");

const { getConversations } = require("../../controller/chat/getConversations");
const { createOrGetDirectConversation } = require("../../controller/chat/createOrGetDirectConversation");
const { getMessages } = require("../../controller/chat/getMessages");
const { sendMessage } = require("../../controller/chat/sendMessage");
const { deleteMessage } = require("../../controller/chat/deleteMessage");
const { updateMessage } = require("../../controller/chat/updateMessage");
const { deleteConversation } = require("../../controller/chat/deleteConversation");
const { markConversationRead } = require("../../controller/chat/markRead");
const { reactMessage, pinMessage } = require("../../controller/chat/reactMessage");
const { searchMessages } = require("../../controller/chat/searchMessages");
const { toggleMute, toggleArchive } = require("../../controller/chat/muteArchive");
const { uploadMedia } = require("../../controller/chat/uploadMedia");

router.use(authMiddleware, checkActive);

router.get("/conversations", getConversations);
router.post("/conversations/direct/:userId", createOrGetDirectConversation);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);
router.post("/conversations/:id/read", markConversationRead);
router.get("/conversations/:id/search", searchMessages);
router.post("/conversations/:id/mute", toggleMute);
router.post("/conversations/:id/archive", toggleArchive);
router.post("/messages/:id/react", reactMessage);
router.patch("/messages/:id/pin", pinMessage);
router.post("/upload", upload.single("file"), uploadMedia);
router.delete("/conversations/:id", deleteConversation);
router.put("/messages/:id", updateMessage);
router.delete("/messages/:id", deleteMessage);

module.exports = router;
