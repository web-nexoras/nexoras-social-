const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");
const Subscription = require("../../models/Subscription");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");

const deleteGroup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    await GroupMembership.deleteMany({ group: group._id });
    await Subscription.deleteMany({ group: group._id });
    if (group.conversation) {
      await Message.deleteMany({ conversation: group.conversation });
      await Conversation.deleteOne({ _id: group.conversation });
    }
    await group.deleteOne();

    return res.status(200).json({ success: true, message: "Group deleted" });
  } catch (error) {
    console.error("Delete group error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { deleteGroup };
