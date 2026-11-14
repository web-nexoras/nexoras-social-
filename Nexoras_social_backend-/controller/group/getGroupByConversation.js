const mongoose = require("mongoose");
const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");

const getGroupByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: "Invalid conversation ID" });
    }

    const group = await Group.findOne({ conversation: conversationId });
    if (!group) {
      return res.status(404).json({ success: false, message: "No group for this conversation" });
    }

    const membership = await GroupMembership.findOne({
      group: group._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      isMember: !!membership,
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        price: group.price,
        currency: group.currency,
        image: group.image,
        conversation: group.conversation,
      },
    });
  } catch (error) {
    console.error("Get group by conversation error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getGroupByConversation };
