import bodyParser from "body-parser";
import cors from "cors";
import express from "express";

import { ROUTES } from "./constants/CONSTANTS.json";
import { NotificationsApiRoute } from "./routes/notifications-api";

class App {
    public app: express.Application;
    private notificationsApiRoute: express.Router;
    constructor() {
        this.app = express();
        this.notificationsApiRoute = new NotificationsApiRoute().router;
        this.config();
    }
    private config() {
        //middlewares
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        this.app.use(cors());
        // this.app.options("*", cors());

        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        //routes
        this.app.use(ROUTES.NOTIFICATIONS_API, this.notificationsApiRoute);
    }
}

export default new App().app;
