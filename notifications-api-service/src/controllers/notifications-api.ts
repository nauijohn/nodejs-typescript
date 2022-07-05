import express from "express";
import { isArray, isNull } from "lodash";
import StackTracey from "stacktracey";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";

import { DYNAMODB, STATUS_CODES } from "../constants/CONSTANTS.json";
import { ERRORS, FAILED } from "../constants/MESSAGES.json";
import { GetNotificationsRequestDto } from "../dtos/requests/get-notifications";
import { SaveNotificationsByBatchRequestDto } from "../dtos/requests/save-notifcations-by-batch";
import { SaveNotificationsRequestDto } from "../dtos/requests/save-notifications";
import { ToggleOrSoftDeleteRequestDto } from "../dtos/requests/toggleOrSoftDelete";
import { GetNotificationsResponseDto } from "../dtos/responses/get-notifications";
import { SaveNotificationsByBatchResponseDto } from "../dtos/responses/save-notifications-by-batch";
import { ToggleOrSoftDeleteResponseDto } from "../dtos/responses/toggleOrSoftDelete";
import { Error } from "../models/error";
import { Logger } from "../models/logger";
import { NotificationsApiService } from "../services/notifications-api";
import { Helpers } from "../utils/helpers";

export class NotificationsApiController {
    private notificationsApiService: NotificationsApiService;
    private logger: winston.Logger;
    private stackTracey: StackTracey;
    private service: string;
    constructor() {
        this.notificationsApiService = new NotificationsApiService();
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
    }
    public async getNotifications(req: express.Request): Promise<GetNotificationsResponseDto> {
        try {
            this.logger.info(`Controller: ${this.getNotifications.name}`);

            const { id, client_id, createdDate, toDate, page, limit, read, order, isBatch, batch_id } = req.query;
            const params: GetNotificationsRequestDto = new GetNotificationsRequestDto(
                id,
                client_id,
                createdDate,
                toDate,
                page,
                limit,
                read,
                order,
                isBatch,
                batch_id
            );
            const response: GetNotificationsResponseDto = await this.notificationsApiService.getNotifications(params);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async saveNotifications(req: express.Request): Promise<SaveNotificationsByBatchResponseDto> {
        try {
            this.logger.info(`Controller: ${this.saveNotifications.name}`);

            if (!req.headers.authorization)
                throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, ERRORS.BAD_REQUESTS.PROVIDE_TOKEN);

            const { client_id, data } = req.body;
            const { authorization } = req.headers;
            const userIdFromToken: string = Helpers.decodeUserIdFromAccesToken(authorization);
            const created_at: string = Helpers.generateTimeNowInCustomFormat();
            const params: SaveNotificationsRequestDto = new SaveNotificationsRequestDto(
                client_id,
                data,
                userIdFromToken,
                created_at,
                created_at
            );

            const response: SaveNotificationsByBatchResponseDto = await this.notificationsApiService.saveNotifications(params);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async saveNotifcationsByBatch(req: express.Request): Promise<SaveNotificationsByBatchResponseDto> {
        try {
            this.logger.info(`Controller: ${this.saveNotifcationsByBatch.name}`);

            if (!req.headers.authorization)
                throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, ERRORS.BAD_REQUESTS.PROVIDE_TOKEN);

            const client_ids: string[] = Array.isArray(req.body.client_ids) ? req.body.client_ids : [];
            const client_ids_filtered: string[] = Helpers.removeDuplicateOrNullInArray(client_ids);
            const { data } = req.body;
            const { authorization } = req.headers;
            const userIdFromToken: string = Helpers.decodeUserIdFromAccesToken(authorization);
            const created_at: string = Helpers.generateTimeNowInCustomFormat();
            const batch_id: string = uuidv4();

            const params: SaveNotificationsByBatchRequestDto[] = client_ids_filtered.map(
                (client_id: string) =>
                    new SaveNotificationsByBatchRequestDto(client_id, data, batch_id, userIdFromToken, created_at, created_at)
            );
            const response: SaveNotificationsByBatchResponseDto = await this.notificationsApiService.saveNotificationsByBatch(
                params,
                batch_id
            );
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async toggle(req: express.Request): Promise<ToggleOrSoftDeleteResponseDto> {
        try {
            this.logger.info(`Controller: ${this.toggle.name}`);

            const { isBatch, batch_id } = req.body;
            let { id } = req.body;
            if (isArray(id)) id = Helpers.removeDuplicateOrNullInArray(id);
            const params: ToggleOrSoftDeleteRequestDto = new ToggleOrSoftDeleteRequestDto(id, isBatch, batch_id);
            if (!params.isBatch) {
                if (isNull(params.id)) throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, { message: FAILED.NO_ID });
            } else {
                if (isNull(params.batch_id))
                    throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, { message: FAILED.NO_BATCH_ID });
            }
            const result: ToggleOrSoftDeleteResponseDto = await this.notificationsApiService.toggleOrSoftDelete(
                params,
                DYNAMODB.BRAD_TABLE.KEYS.READ
            );
            return result;
        } catch (err: any) {
            throw err;
        }
    }

    public async softDelete(req: express.Request): Promise<ToggleOrSoftDeleteResponseDto> {
        try {
            this.logger.info(`Controller: ${this.softDelete.name}`);

            const { isBatch, batch_id } = req.body;
            let { id } = req.body;
            if (isArray(id)) id = Helpers.removeDuplicateOrNullInArray(id);
            const params: ToggleOrSoftDeleteRequestDto = new ToggleOrSoftDeleteRequestDto(id, isBatch, batch_id);
            if (!params.isBatch) {
                if (isNull(params.id)) throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, { message: FAILED.NO_ID });
            } else {
                if (isNull(params.batch_id))
                    throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, { message: FAILED.NO_BATCH_ID });
            }
            const result: ToggleOrSoftDeleteResponseDto = await this.notificationsApiService.toggleOrSoftDelete(
                params,
                DYNAMODB.BRAD_TABLE.KEYS.DELETED_AT
            );
            return result;
        } catch (err: any) {
            throw err;
        }
    }
}
