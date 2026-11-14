const express = require("express");
const router = express.Router();
const allRoutes = require("./chatAllRoutes");
router.use("/", allRoutes);
module.exports = router;
