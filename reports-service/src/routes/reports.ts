import express from "express";
import StackTracey from "stacktracey";
import winston from "winston";

import { CONTROLLERS, STATUS_CODES } from "../constants/CONSTANTS.json";
import { ReportsController } from "../controllers/reports";
import { ReportsResponseDto } from "../dtos/responses/reports";
import { Logger } from "../models/logger";
import { Payload } from "../models/payload";

export class ReportsRoute {
    private logger: winston.Logger;
    private reportsController: ReportsController;
    private service: string;
    private stackTracey: StackTracey;
    public router: express.Router;
    constructor() {
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
        this.reportsController = new ReportsController();
        this.router = express.Router();
        this.routes();
    }

    private routes() {
        this.router.get(
            CONTROLLERS.REPORTS.TICKET_COUNT_HISTORY,
            async (req: express.Request, res: express.Response) => {
                try {
                    this.logger.info(`Route: ${CONTROLLERS.REPORTS.TICKET_COUNT_HISTORY}`);
                    const response: ReportsResponseDto = await this.reportsController.ticketCountHistory(req);
                    const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                    res.status(payload.statusCode).send(payload);
                } catch (err: any) {
                    this.logger.error(err);
                    if (err.statusCode) res.status(err.statusCode).send(err);
                    else res.send(err);
                }
            }
        );

        this.router.get(
            CONTROLLERS.REPORTS.TICKETS_ASSIGNED_PER_RIDER,
            async (req: express.Request, res: express.Response) => {
                try {
                    this.logger.info(`Route: ${CONTROLLERS.REPORTS.TICKETS_ASSIGNED_PER_RIDER}`);
                    const response: ReportsResponseDto = await this.reportsController.ticketsAssignedPerRider(req);
                    const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                    res.status(payload.statusCode).send(payload);
                } catch (err: any) {
                    this.logger.error(err);
                    if (err.statusCode) res.status(err.statusCode).send(err);
                    else res.send(err);
                }
            }
        );

        this.router.get(
            CONTROLLERS.REPORTS.ORIGIN_VS_DESTINATION_VOLUME,
            async (req: express.Request, res: express.Response) => {
                try {
                    this.logger.info(`Route: ${CONTROLLERS.REPORTS.ORIGIN_VS_DESTINATION_VOLUME}`);
                    const response: ReportsResponseDto = await this.reportsController.originVsDestinationVolume(req);
                    const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                    res.status(payload.statusCode).send(payload);
                } catch (err: any) {
                    this.logger.error(err);
                    if (err.statusCode) res.status(err.statusCode).send(err);
                    else res.send(err);
                }
            }
        );

        this.router.get(CONTROLLERS.REPORTS.DATE_RANGE_MONTHLY, async (req, res) => {
            await this.reportsController.dateRangeMonthly(req, res);
        });

        this.router.get(CONTROLLERS.REPORTS.DAILY_DATE_RANGE, async (req, res) => {
            await this.reportsController.dailyDateRange(req, res);
        });

        this.router.get(CONTROLLERS.REPORTS.PER_CATEGORY_DAILY, async (req, res) => {
            await this.reportsController.perCategoryDaily(req, res);
        });

        this.router.get(
            CONTROLLERS.REPORTS.MONTHLY_PERFORMANCE,
            async (req: express.Request, res: express.Response) => {
                try {
                    this.logger.info(`Route: ${CONTROLLERS.REPORTS.MONTHLY_PERFORMANCE}`);
                    const response: ReportsResponseDto = await this.reportsController.monthlyPerformance(req);
                    const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                    res.status(payload.statusCode).send(payload);
                } catch (err: any) {
                    this.logger.error(err);
                    if (err.statusCode) res.status(err.statusCode).send(err);
                    else res.send(err);
                }
            }
        );

        this.router.get(CONTROLLERS.REPORTS.DAILY_PERFORMANCE, async (req: express.Request, res: express.Response) => {
            try {
                this.logger.info(`Route: ${CONTROLLERS.REPORTS.DAILY_PERFORMANCE}`);
                const response: ReportsResponseDto = await this.reportsController.dailyPerformance(req);
                const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                res.status(payload.statusCode).send(payload);
            } catch (err: any) {
                this.logger.error(err);
                if (err.statusCode) res.status(err.statusCode).send(err);
                else res.send(err);
            }
        });
    }
}
