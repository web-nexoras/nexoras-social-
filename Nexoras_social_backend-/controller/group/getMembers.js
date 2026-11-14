const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");

const getMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const memberships = await GroupMembership.find({ group: group._id }).populate(
      "user",
      "fullname email avatar role"
    );

    const valid = memberships.filter((m) => m.user);
    return res.status(200).json({ success: true, count: valid.length, members: valid });
  } catch (error) {
    console.error("Get members error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getMembers };
