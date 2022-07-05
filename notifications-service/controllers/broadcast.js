const EventEmitter = require("events");
const { STATUS_CODES } = require("../constants/CONSTANTS.json");
const eventEmitter = new EventEmitter();

exports.broadcast = (req, res) => {
    const notificationData = {
        message: req.body.message,
        authorizationHeader: req.headers.authorization,
    };

    eventEmitter.emit("broadcast", notificationData);
    const response = {
        statusCode: STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
        status: "success",
        message: req.body.message,
    };

    res.status(STATUS_CODES.SUCCESSFUL_RESPONSE.OK).send(response);
};