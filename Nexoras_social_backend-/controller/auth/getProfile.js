const { safeGet, safeSet } = require("../../helpers/redis");

// -----------profile controller
const getProfile = async (req, res) => {
  try {
    const cacheKey = `profile:${req.user._id}`;

    // Cache is best-effort — Redis being down must never fail this endpoint.
    const cached = await safeGet(cacheKey);
    if (cached) {
      try {
        return res.status(200).send(JSON.parse(cached));
      } catch {
        // corrupt cache entry — fall through and rebuild it
      }
    }

    const profile = {
      _id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      address: req.user.address,
      isVerified: req.user.isVerified,
      isApproved: req.user.isApproved,
    };

    await safeSet(cacheKey, JSON.stringify(profile), { EX: 300 });

    res.status(200).send(profile);
  } catch (error) {
    console.log("PROFILE ERROR:", error);

    return res.status(500).send({
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  getProfile,
};
