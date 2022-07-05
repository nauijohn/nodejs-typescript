const config = require("config");
const { CONFIG } = require("../constants/CONSTANTS.json");
const AWS = require("aws-sdk");

AWS.config.update({
    region: config.get(CONFIG.AWS.REGIONS.SINGAPORE),
});
const sqs = new AWS.SQS({
    apiVersion: config.get(CONFIG.AWS.API_VERSION.SQS),
});

exports.listQueues = (params) => {
    return new Promise((res, rej) => {
        sqs.listQueues(params, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
};

exports.createQueue = (params) => {
    return new Promise((res, rej) => {
        sqs.createQueue(params, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
};

exports.getQueueUrl = (params) => {
    return new Promise((res, rej) => {
        sqs.getQueueUrl(params, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
};

exports.deleteQueue = (params) => {
    return new Promise((res, rej) => {
        sqs.deleteQueue(params, function(err, data) {
            if (err) rej(err);
            else res(data);
        });
    });
};

exports.sendMessage = (params) => {
    return new Promise((res, rej) => {
        sqs.sendMessage(params, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
};

exports.receiveMessage = (params) => {
    return new Promise((res, rej) => {
        sqs.receiveMessage(params, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
};

exports.deleteMessage = (params) => {
    return new Promise((res, rej) => {
        sqs.deleteMessage(params, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
};