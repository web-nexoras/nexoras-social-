const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");

const { createGroup } = require("../../controller/group/createGroup");
const { getAllGroups } = require("../../controller/group/getAllGroups");
const { getGroup } = require("../../controller/group/getGroup");
const { getGroupByConversation } = require("../../controller/group/getGroupByConversation");
const { updateGroup } = require("../../controller/group/updateGroup");
const { deleteGroup } = require("../../controller/group/deleteGroup");
const { addMembers } = require("../../controller/group/addMembers");
const { getMembers } = require("../../controller/group/getMembers");
const { getSubscribers } = require("../../controller/group/getSubscribers");
const { changeRole, kickMember, banMember, muteMember, toggleAnnouncement } = require("../../controller/group/groupManage");

// Admin-only helper
const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admin access required" });
};

router.use(authMiddleware, checkActive);

router.get("/", getAllGroups);
router.get("/by-conversation/:conversationId", getGroupByConversation);
router.get("/:id", getGroup);
router.get("/:id/members", getMembers);
router.get("/:id/subscribers", adminOnly, getSubscribers);

router.post("/", adminOnly, createGroup);
router.patch("/:id", updateGroup);
router.delete("/:id", adminOnly, deleteGroup);
router.post("/:id/members", adminOnly, addMembers);
router.patch("/:id/announcement", adminOnly, toggleAnnouncement);
router.patch("/:id/members/:userId/role", adminOnly, changeRole);
router.delete("/:id/members/:userId", adminOnly, kickMember);
router.post("/:id/members/:userId/ban", adminOnly, banMember);
router.post("/:id/members/:userId/mute", adminOnly, muteMember);

module.exports = router;
