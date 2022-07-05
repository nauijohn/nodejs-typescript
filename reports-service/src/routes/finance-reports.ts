import express from "express";

export class FinanceReportsRoute {
    public router: express.Router;
    constructor() {
        this.router = express.Router();
        this.routes();
    }

    private routes() {}
}
