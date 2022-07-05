const express = require("express");
const { BROADCAST } = require("../constants/CONSTANTS.json").CONTROLLERS;
const broadcastController = require("../controllers/broadcast");

const router = express.Router();

router.post(BROADCAST.HOME, broadcastController.broadcast);

module.exports = router;