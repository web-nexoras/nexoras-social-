const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");
const Subscription = require("../../models/Subscription");

// Users who paid (active subscription) for this group but are not members yet
const getSubscribers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const memberships = await GroupMembership.find({ group: group._id }).select("user");
    const memberIds = memberships.map((m) => m.user.toString());

    const subs = await Subscription.find({
      group: group._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate("user", "fullname email avatar");

    const pending = subs
      .filter((s) => s.user && !memberIds.includes(s.user._id.toString()))
      .map((s) => ({
        subscriptionId: s._id,
        expiresAt: s.expiresAt,
        user: s.user,
      }));

    return res.status(200).json({ success: true, count: pending.length, subscribers: pending });
  } catch (error) {
    console.error("Get subscribers error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSubscribers };
