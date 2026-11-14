const express = require("express");
const router = express.Router();
const allRoutes = require("./friendsAllRoutes");
router.use("/", allRoutes);
module.exports = router;
