const Group = require("../../models/Group");
const GroupMembership = require("../../models/GroupMembership");
const Conversation = require("../../models/Conversation");

const createGroup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { name, description, image, price, currency } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }
    if (price === undefined || price === null || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Valid price is required" });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim(),
      image: image?.trim(),
      price: Number(price),
      currency: currency || "BDT",
      createdBy: req.user._id,
    });

    const conversation = await Conversation.create({
      type: "group",
      participants: [req.user._id],
      groupName: group.name,
      groupImage: group.image,
      isPremium: group.isPremium,
      createdBy: req.user._id,
    });

    group.conversation = conversation._id;
    await group.save();

    await GroupMembership.create({
      group: group._id,
      user: req.user._id,
      role: "admin",
    });

    return res.status(201).json({ success: true, message: "Group created", group });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createGroup };
