const loggerController = require("../controller/loggerTest.controller");
const express = require("express");
const router = express.Router();

router.get("/", loggerController.loggerTest);
module.exports = router;
