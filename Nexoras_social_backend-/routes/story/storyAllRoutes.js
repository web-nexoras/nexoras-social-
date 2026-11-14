const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const { createStory } = require("../../controller/story/createStory");
const { getStories } = require("../../controller/story/getStories");
const { viewStory, deleteStory } = require("../../controller/story/viewStory");
const { likeStory } = require("../../controller/story/likeStory");
const { commentStory } = require("../../controller/story/commentStory");

router.use(authMiddleware, checkActive);

router.get("/", getStories);
router.post("/", upload.single("media"), createStory);
router.post("/:id/view", viewStory);
// FB-style: heart a story / reply to it (the reply lands in their chat)
router.post("/:id/like", likeStory);
router.post("/:id/comment", commentStory);
router.delete("/:id", deleteStory);

module.exports = router;