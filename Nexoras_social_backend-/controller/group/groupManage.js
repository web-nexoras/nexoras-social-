const mongoose = require("mongoose");
const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");
const Conversation = require("../../models/Conversation");

const ensureOwnerOrMod = async (groupId, userId) => {
  const mem = await GroupMembership.findOne({ group: groupId, user: userId });
  if (!mem) return null;
  if (mem.role === "owner" || mem.role === "moderator" || mem.role === "admin") return mem;
  return null;
};

const changeRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const actor = await ensureOwnerOrMod(id, req.user._id);
    if (!actor) return res.status(403).json({ success: false, message: "Not allowed" });
    const target = await GroupMembership.findOne({ group: id, user: userId });
    if (!target) return res.status(404).json({ success: false, message: "Member not found" });
    if (target.role === "owner" && actor.role !== "owner") return res.status(403).json({ success: false, message: "Cannot modify owner" });
    target.role = role;
    await target.save();
    return res.status(200).json({ success: true, message: "Role updated", membership: target });
  } catch (error) {
    console.error("Change role error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const kickMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const actor = await ensureOwnerOrMod(id, req.user._id);
    if (!actor) return res.status(403).json({ success: false, message: "Not allowed" });
    const target = await GroupMembership.findOne({ group: id, user: userId });
    if (!target) return res.status(404).json({ success: false, message: "Member not found" });
    if (target.role === "owner") return res.status(403).json({ success: false, message: "Cannot kick owner" });
    await GroupMembership.deleteOne({ _id: target._id });
    if (group.conversation) {
      await Conversation.findByIdAndUpdate(group.conversation, { $pull: { participants: userId } });
    }
    return res.status(200).json({ success: true, message: "Member kicked" });
  } catch (error) {
    console.error("Kick member error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const banMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const actor = await ensureOwnerOrMod(id, req.user._id);
    if (!actor) return res.status(403).json({ success: false, message: "Not allowed" });
    const target = await GroupMembership.findOne({ group: id, user: userId });
    if (target) {
      target.banned = true;
      target.role = "banned";
      await target.save();
    } else {
      await GroupMembership.create({ group: id, user: userId, role: "banned", banned: true });
    }
    if (group.conversation) {
      await Conversation.findByIdAndUpdate(group.conversation, { $pull: { participants: userId } });
    }
    return res.status(200).json({ success: true, message: "Member banned" });
  } catch (error) {
    console.error("Ban member error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const muteMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { minutes } = req.body;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const actor = await ensureOwnerOrMod(id, req.user._id);
    if (!actor) return res.status(403).json({ success: false, message: "Not allowed" });
    const target = await GroupMembership.findOne({ group: id, user: userId });
    if (!target) return res.status(404).json({ success: false, message: "Member not found" });
    const mins = Number(minutes) || 60;
    target.mutedUntil = new Date(Date.now() + mins * 60 * 1000);
    target.role = "muted";
    await target.save();
    return res.status(200).json({ success: true, message: "Member muted", mutedUntil: target.mutedUntil });
  } catch (error) {
    console.error("Mute member error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleAnnouncement = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const actor = await ensureOwnerOrMod(id, req.user._id);
    if (!actor) return res.status(403).json({ success: false, message: "Not allowed" });
    group.announcementOnly = !group.announcementOnly;
    await group.save();
    return res.status(200).json({ success: true, announcementOnly: group.announcementOnly });
  } catch (error) {
    console.error("Toggle announcement error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { changeRole, kickMember, banMember, muteMember, toggleAnnouncement };