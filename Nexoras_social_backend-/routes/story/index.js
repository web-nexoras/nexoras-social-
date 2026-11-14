const express = require("express");
const router = express.Router();
const allRoutes = require("./storyAllRoutes");
router.use("/", allRoutes);
module.exports = router;