const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");

const { getSuggestions } = require("../../controller/friends/getSuggestions");
const { sendFriendRequest } = require("../../controller/friends/sendFriendRequest");
const { getIncomingRequests } = require("../../controller/friends/getIncomingRequests");
const { getSentRequests } = require("../../controller/friends/getSentRequests");
const { acceptRequest } = require("../../controller/friends/acceptRequest");
const { rejectRequest } = require("../../controller/friends/rejectRequest");
const { cancelRequest } = require("../../controller/friends/cancelRequest");
const { getFriends } = require("../../controller/friends/getFriends");
const { getFriendProfile } = require("../../controller/friends/getFriendProfile");

router.use(authMiddleware, checkActive);

router.get("/suggestions", getSuggestions);
router.get("/", getFriends);
router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/sent", getSentRequests);
router.post("/request/:userId", sendFriendRequest);
router.patch("/requests/:id/accept", acceptRequest);
router.patch("/requests/:id/reject", rejectRequest);
router.patch("/requests/:id/cancel", cancelRequest);
router.get("/profile/:userId", getFriendProfile);

module.exports = router;
