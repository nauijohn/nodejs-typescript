import express from "express";
import StackTracey from "stacktracey";
import winston from "winston";

import { CONTROLLERS, STATUS_CODES } from "../constants/CONSTANTS.json";
import { NotificationsApiController } from "../controllers/notifications-api";
import { Logger } from "../models/logger";
import { Payload } from "../models/payload";

export class NotificationsApiRoute {
    public router: express.Router;
    private notificationsApiController: NotificationsApiController;
    private logger: winston.Logger;
    private stackTracey: StackTracey;
    private service: string;
    constructor() {
        this.router = express.Router();
        this.notificationsApiController = new NotificationsApiController();
        this.routes();
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
    }

    private routes() {
        this.router.get(CONTROLLERS.NOTIFICATIONS_API.GET_NOTIFICATIONS, async (req: express.Request, res: express.Response) => {
            try {
                this.logger.info(`Route: ${CONTROLLERS.NOTIFICATIONS_API.GET_NOTIFICATIONS}`);
                const response = await this.notificationsApiController.getNotifications(req);
                const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                res.status(payload.statusCode).send(payload);
            } catch (err: any) {
                if (err.statusCode) res.status(err.statusCode).send(err);
                else res.send(err);
            }
        });
        this.router.post(CONTROLLERS.NOTIFICATIONS_API.SAVE_NOTIFICATIONS, async (req: express.Request, res: express.Response) => {
            try {
                this.logger.info(`Route: ${CONTROLLERS.NOTIFICATIONS_API.SAVE_NOTIFICATIONS}`);
                const response = await this.notificationsApiController.saveNotifications(req);
                const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                res.status(payload.statusCode).send(payload);
            } catch (err: any) {
                if (err.statusCode) res.status(err.statusCode).send(err);
                else res.send(err);
            }
        });
        this.router.post(CONTROLLERS.NOTIFICATIONS_API.SAVE_NOTIFICATIONS_BY_BATCH, async (req: express.Request, res: express.Response) => {
            try {
                this.logger.info(`Route: ${CONTROLLERS.NOTIFICATIONS_API.SAVE_NOTIFICATIONS_BY_BATCH}`);
                const response = await this.notificationsApiController.saveNotifcationsByBatch(req);
                const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                res.status(payload.statusCode).send(payload);
            } catch (err: any) {
                if (err.statusCode) res.status(err.statusCode).send(err);
                else res.send(err);
            }
        });
        this.router.put(CONTROLLERS.NOTIFICATIONS_API.TOGGLE, async (req: express.Request, res: express.Response) => {
            try {
                this.logger.info(`Route: ${CONTROLLERS.NOTIFICATIONS_API.TOGGLE}`);
                const response = await this.notificationsApiController.toggle(req);
                const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                res.status(payload.statusCode).send(payload);
            } catch (err: any) {
                if (err.statusCode) res.status(err.statusCode).send(err);
                else res.send(err);
            }
        });
        this.router.put(CONTROLLERS.NOTIFICATIONS_API.SOFT_DELETE, async (req: express.Request, res: express.Response) => {
            try {
                this.logger.info(`Route: ${CONTROLLERS.NOTIFICATIONS_API.SOFT_DELETE}`);
                const response = await this.notificationsApiController.softDelete(req);
                const payload: Payload = new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, response);
                res.status(payload.statusCode).send(payload);
            } catch (err: any) {
                if (err.statusCode) res.status(err.statusCode).send(err);
                else res.send(err);
            }
        });
    }
}
