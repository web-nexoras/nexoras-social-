const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");

const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("createdBy", "fullname email")
      .sort({ createdAt: -1 });
    const userId = req.user._id;

    const memberships = await GroupMembership.find({ user: userId });
    const memberMap = new Map(memberships.map((m) => [m.group.toString(), m]));

    const result = groups.map((g) => ({
      ...g.toObject(),
      isMember: memberMap.has(g._id.toString()),
      membership: memberMap.get(g._id.toString()) || null,
    }));

    return res
      .status(200)
      .json({ success: true, count: result.length, groups: result });
  } catch (error) {
    console.error("Get all groups error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAllGroups };
