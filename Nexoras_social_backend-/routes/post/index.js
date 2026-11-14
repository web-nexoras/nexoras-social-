const express = require("express");
const router = express.Router();
const allRoutes = require("./postAllRoutes");
router.use("/", allRoutes);
module.exports = router;