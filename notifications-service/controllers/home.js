const EventEmitter = require("events");
const { STATUS_CODES } = require("../constants/CONSTANTS.json");
const eventEmitter = new EventEmitter();

exports.emit = async(req, res) => {
    //const canProceed = await isTokenValid(req);

    const notificationData = {
        filter: req.body.filter,
        message: req.body.message,
        authorizationHeader: req.headers.authorization,
    };

    eventEmitter.emit("send", notificationData);

    const response = {
        statusCode: STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
        status: "success",
        message: req.body.message,
        filter: req.body.filter,
    };

    res.status(STATUS_CODES.SUCCESSFUL_RESPONSE.OK).send(response);
};