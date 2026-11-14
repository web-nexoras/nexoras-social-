const Group = require("../../models/Group");

const updateGroup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isOwner = String(group.createdBy) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const { name, description, image, price, currency } = req.body;
    if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }
    if (name !== undefined) group.name = String(name).trim();
    if (description !== undefined) group.description = String(description).trim();
    if (image !== undefined) group.image = String(image).trim();
    if (price !== undefined) group.price = Number(price);
    if (currency !== undefined) group.currency = String(currency).trim();

    await group.save();

    const Conversation = require("../../models/Conversation");
    if (group.conversation) {
      const convUpdate = {};
      if (name !== undefined) convUpdate.groupName = group.name;
      if (image !== undefined) convUpdate.groupImage = group.image;
      if (Object.keys(convUpdate).length) {
        await Conversation.findByIdAndUpdate(group.conversation, convUpdate);
      }
    }

    return res.status(200).json({ success: true, message: "Group updated", group });
  } catch (error) {
    console.error("Update group error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { updateGroup };
