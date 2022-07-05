module.exports = class Error {
    constructor(statusCode, data) {
        this.statusCode = statusCode;
        this.data = data;
    }
};