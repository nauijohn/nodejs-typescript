require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const homeRoute = require("./routes/home");
const broadcastRoute = require("./routes/broadcast");
const { ROUTES } = require("./constants/CONSTANTS.json");

const app = express();

// MIDDLEWARES
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Handle CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// ROUTES
app.use(ROUTES.HOME, homeRoute);
app.use(ROUTES.BROADCAST, broadcastRoute);

module.exports.app = app;