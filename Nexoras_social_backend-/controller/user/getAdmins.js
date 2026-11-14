const User = require("../../models/User");

const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin", isActive: true }, { fullname: 1, email: 1, avatar: 1 });
    return res.status(200).json({ success: true, count: admins.length, admins });
  } catch (error) {
    console.error("Get admins error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAdmins };
