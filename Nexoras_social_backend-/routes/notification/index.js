const express = require("express");
const router = express.Router();
const allRoutes = require("./notificationAllRoutes");
router.use("/", allRoutes);
module.exports = router;