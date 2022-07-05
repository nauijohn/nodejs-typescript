module.exports = class Payload {
    constructor(statusCode, data) {
        this.statusCode = statusCode;
        this.data = data;
    }
};