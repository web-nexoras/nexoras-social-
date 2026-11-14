const express = require("express");
const router = express.Router();

// ---------base url for all routes
const baseUrl = process.env.BASE_URL || "/api/v1";

// ---------importing routes
const authRoutes = require("./auth/index");
const friendsRoutes = require("./friends/index");
const chatRoutes = require("./chat/index");
const groupRoutes = require("./group/index");
const subscriptionRoutes = require("./subscription/index");
const userRoutes = require("./user/index");
const postRoutes = require("./post/index");
const storyRoutes = require("./story/index");
const followRoutes = require("./follow/index");
const notificationRoutes = require("./notification/index");

router.use(baseUrl, authRoutes);
router.use(`${baseUrl}/friends`, friendsRoutes);
router.use(`${baseUrl}/chat`, chatRoutes);
router.use(`${baseUrl}/groups`, groupRoutes);
router.use(`${baseUrl}/payments`, subscriptionRoutes);
router.use(`${baseUrl}/users`, userRoutes);
router.use(`${baseUrl}/posts`, postRoutes);
router.use(`${baseUrl}/stories`, storyRoutes);
router.use(`${baseUrl}/follows`, followRoutes);
router.use(`${baseUrl}/notifications`, notificationRoutes);

module.exports = router;
