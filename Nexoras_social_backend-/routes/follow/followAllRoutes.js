const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");

const { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } = require("../../controller/follow/followUser");

router.use(authMiddleware, checkActive);

router.post("/:userId", followUser);
router.delete("/:userId", unfollowUser);
router.get("/:userId/status", isFollowing);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

module.exports = router;