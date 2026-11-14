const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");
const Subscription = require("../../models/Subscription");
const Conversation = require("../../models/Conversation");

const addMembers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || !userIds.length) {
      return res.status(400).json({ success: false, message: "userIds array is required" });
    }

    const added = [];
    const skipped = [];
    for (const userId of userIds) {
      // Admin can add anyone for free; a subscription is only used for the expiry date
      const activeSub = await Subscription.findOne({
        user: userId,
        group: group._id,
        status: "active",
        expiresAt: { $gt: new Date() },
      });

      try {
        const membership = await GroupMembership.create({
          group: group._id,
          user: userId,
          role: "member",
          premiumExpiresAt: activeSub ? activeSub.expiresAt : undefined,
        });
        added.push(membership);

        if (group.conversation) {
          await Conversation.findByIdAndUpdate(group.conversation, {
            $addToSet: { participants: userId },
          });
        }
      } catch (error) {
        // Duplicate key = already a member → skip; any other error is real
        if (error.code === 11000) skipped.push(userId);
        else throw error;
      }
    }

    return res.status(200).json({ success: true, message: "Members processed", addedCount: added.length, skippedCount: skipped.length });
  } catch (error) {
    console.error("Add members error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addMembers };
