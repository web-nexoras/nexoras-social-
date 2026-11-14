const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

const { createPost } = require("../../controller/post/createPost");
const { getFeed } = require("../../controller/post/getFeed");
const { getPost } = require("../../controller/post/getPost");
const { deletePost } = require("../../controller/post/deletePost");
const { updatePost } = require("../../controller/post/updatePost");
const { toggleReaction } = require("../../controller/post/toggleReaction");
const { addComment } = require("../../controller/post/addComment");
const { getComments } = require("../../controller/post/getComments");
const { updateComment } = require("../../controller/post/updateComment");
const { deleteComment } = require("../../controller/post/deleteComment");
const { savePost, getSavedPosts } = require("../../controller/post/savePost");
const { sharePost } = require("../../controller/post/sharePost");
const { getPostsByHashtag } = require("../../controller/post/getPostsByHashtag");
const { getReactions } = require("../../controller/post/getReactions");

router.use(authMiddleware, checkActive);

router.get("/feed", getFeed);
router.get("/saved", getSavedPosts);
router.get("/hashtag/:tag", getPostsByHashtag);
router.post("/", upload.array("images", 5), createPost);
router.get("/:id", getPost);
router.put("/:id", upload.array("images", 5), updatePost);
router.delete("/:id", deletePost);
router.post("/:id/share", sharePost);
router.post("/:id/save", savePost);
router.post("/:targetType/:targetId/react", toggleReaction);
router.get("/:targetType/:targetId/reactions", getReactions);
router.post("/:postId/comments", addComment);
router.get("/:postId/comments", getComments);
router.put("/comments/:id", updateComment);
router.delete("/comments/:id", deleteComment);

module.exports = router;