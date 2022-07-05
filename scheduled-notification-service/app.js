const express = require("express");
const bodyParser = require("body-parser");

const sqsService = require("./services/aws/sqs");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.get("/", async(req, res, next) => {
//     try {
//         const result = await sqsService.listQueues();
//         res.send(result);
//     } catch (err) {
//         res.status(err.statusCode).send(err);
//     }
// });

// app.delete("/delSQS", async(req, res, next) => {
//     try {
//         // console.log(req.body.e);
//         // const test = req.body.messageRetentionPeriod;
//         // console.log(test);
//         const result = await sqsService.deleteQueue(req);
//         res.status(result.statusCode).send(result);
//     } catch (err) {
//         res.status(err.statusCode).send(err);
//     }
// });

app.post("/sendMessage", async(req, res, next) => {
    try {
        const result = await sqsService.sendMessage(req);
        res.status(result.statusCode).send(result);
    } catch (err) {
        res.status(err.statusCode).send(err);
    }
});

app.post("/createQueues", async(req, res, next) => {
    try {
        const result = await sqsService.createQueues(req);
        res.status(result.statusCode).send(result);
    } catch (err) {
        res.status(err.statusCode).send(err);
    }
});

app.get("/receiveMessage", async(req, res) => {
    try {
        const { queueUrl } = req.body;
        const result = await sqsService.receiveMessage(queueUrl);
        res.status(result.statusCode).send(result);
    } catch (err) {
        res.status(err.statusCode).send(err);
    }
});

app.get("/listQueues", async(req, res) => {
    try {
        const result = await sqsService.listQueues();
        res.status(result.statusCode).send(result);
    } catch (err) {
        res.status(err.statusCode).send(err);
    }
});

module.exports.app = app;