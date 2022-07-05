import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import _ from "lodash";

import { ROUTES } from "./constants/CONSTANTS.json";
import { FinanceReportsRoute } from "./routes/finance-reports";
import { ReportsRoute } from "./routes/reports";

class App {
    public app: express.Application;
    private reportsRoute: express.Router;
    private financeReportsRoute: express.Router;
    constructor() {
        this.app = express();
        this.reportsRoute = new ReportsRoute().router;
        this.financeReportsRoute = new FinanceReportsRoute().router;
        this.config();
    }
    private config(): void {
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
        this.app.use(ROUTES.REPORTS_SERVICE, this.reportsRoute);
        this.app.use(ROUTES.FINANCE_REPORTS, this.financeReportsRoute);
    }
}

export default new App().app;
