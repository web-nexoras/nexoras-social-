const User = require("../../models/User");

const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status === "active") filter.isActive = true;
    if (req.query.status === "inactive") filter.isActive = false;
    if (req.query.approved === "true") filter.isApproved = true;
    if (req.query.approved === "false") filter.isApproved = false;
    if (req.query.approval && ["pending", "approved", "rejected"].includes(req.query.approval)) {
      filter.status = req.query.approval;
    }
    if (req.query.search) {
      const q = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { fullname: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAllUsers };
