const express = require("express");
const homeController = require("../controllers/home");
const { HOME } = require("../constants/CONSTANTS.json").CONTROLLERS;

const router = express.Router();

router.post(HOME, homeController.emit);

module.exports = router;