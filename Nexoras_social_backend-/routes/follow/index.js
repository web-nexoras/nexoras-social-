const express = require("express");
const router = express.Router();
const allRoutes = require("./followAllRoutes");
router.use("/", allRoutes);
module.exports = router;