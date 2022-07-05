const Error = require("../../models/error");
const Payload = require("../../models/payload");
const sqs = require("../../AWS/sqs");
const { STATUS_CODES } = require("../../constants/CONSTANTS.json");

exports.listQueues = async() => {
    try {
        const params = {};
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
            await sqs.listQueues(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};

exports.createQueues = async(
    queueName,
    delaySeconds,
    messageRetentionPeriod
) => {
    try {
        let params = {
            QueueName: queueName ? queueName : null,
            Attributes: {
                DelaySeconds: delaySeconds ? delaySeconds : "0",
                MessageRetentionPeriod: messageRetentionPeriod ?
                    messageRetentionPeriod :
                    "345600",
            },
        };
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.CREATED,
            await sqs.createQueue(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};

exports.getQueueUrl = async(queueName) => {
    try {
        let params = {
            QueueName: queueName ? queueName : null,
        };
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
            await sqs.getQueueUrl(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};

exports.deleteQueue = async(queueUrl) => {
    try {
        let params = {
            QueueUrl: queueUrl ? queueUrl : null,
        };
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
            await sqs.deleteQueue(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};

exports.sendMessage = async(
    queueUrl,
    messageBody,
    messageAttributes,
    delaySeconds
) => {
    try {
        let params = {
            // Remove DelaySeconds parameter and value for FIFO queues
            DelaySeconds: delaySeconds ? delaySeconds : 10,
            MessageAttributes: messageAttributes ? messageAttributes : null,
            MessageBody: messageBody ? messageBody : null,
            // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
            // MessageGroupId: "Group1",  // Required for FIFO queues
            QueueUrl: queueUrl ? queueUrl : null,
        };
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
            await sqs.sendMessage(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};

exports.receiveMessage = async(queueUrl) => {
    try {
        let params = {
            AttributeNames: ["SentTimestamp"],
            MaxNumberOfMessages: 10,
            MessageAttributeNames: ["All"],
            QueueUrl: queueUrl ? queueUrl : null,
            VisibilityTimeout: 20,
            WaitTimeSeconds: 0,
        };
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
            await sqs.receiveMessage(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};

exports.deleteMessage = async(red) => {
    try {
        let params = {
            QueueUrl: queueUrl ? queueUrl : null,
            ReceiptHandle: receiptHandle ? receiptHandle : null,
        };
        return new Payload(
            STATUS_CODES.SUCCESSFUL_RESPONSE.OK,
            await sqs.deleteMessage(params)
        );
    } catch (err) {
        throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
    }
};