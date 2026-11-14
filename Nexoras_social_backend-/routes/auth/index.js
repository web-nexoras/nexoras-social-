const express = require("express");
const router = express.Router();

// ---------importing routes
const allroutes = require("./authAllRoutes");

router.use("/auth", allroutes);

module.exports = router;
