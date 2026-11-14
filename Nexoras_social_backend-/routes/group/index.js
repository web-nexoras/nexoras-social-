const express = require("express");
const router = express.Router();
const allRoutes = require("./groupAllRoutes");
router.use("/", allRoutes);
module.exports = router;
