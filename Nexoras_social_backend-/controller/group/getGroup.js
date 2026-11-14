const Group = require("../../models/Group");

const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("createdBy", "fullname email")
      .populate("conversation");
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error("Get group error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getGroup };
