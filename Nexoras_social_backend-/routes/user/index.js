const express = require("express");
const router = express.Router();
const allRoutes = require("./userAllRoutes");
router.use("/", allRoutes);
module.exports = router;
