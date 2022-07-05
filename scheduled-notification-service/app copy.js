// const express = require("express");
// const bodyParser = require("body-parser");
// const sqsService = require("./services/aws/sqs");

// class App {
//     app = express();
//     constructor() {
//         this.app = express();
//         this.config();
//     }

//     config() {
//         this.app.use(bodyParser.urlencoded({ extended: false }));
//         this.app.get("/", (req, res, next) => {
//             console.log(sqsService.listQueues());
//             res.send(sqsService.listQueues());
//         });
//     }

//     hello() {
//         console.log("Hello World");
//     }
// }

// module.exports = new App();

// const express = require("express");
// const bodyParser = require("body-parser");

// const app = express();

// app.use(bodyParser.urlencoded({ extended: false }));

// module.exports.app = app;