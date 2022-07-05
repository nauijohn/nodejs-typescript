import _, { isArray } from "lodash";
import moment from "moment";
import NodeCache from "node-cache";
import StackTracey from "stacktracey";
import winston from "winston";

import { BOOLEAN, DYNAMODB, FORMATS, STATUS_CODES } from "../constants/CONSTANTS.json";
import { FAILED, SUCCESS } from "../constants/MESSAGES.json";
import { GetNotificationsRequestDto } from "../dtos/requests/get-notifications";
import { SaveNotificationsByBatchRequestDto } from "../dtos/requests/save-notifcations-by-batch";
import { SaveNotificationsRequestDto } from "../dtos/requests/save-notifications";
import { ToggleOrSoftDeleteRequestDto } from "../dtos/requests/toggleOrSoftDelete";
import { GetNotificationsResponseDto } from "../dtos/responses/get-notifications";
import { SaveNotificationsResponseDto } from "../dtos/responses/save-notifications";
import { SaveNotificationsByBatchResponseDto } from "../dtos/responses/save-notifications-by-batch";
import { ToggleOrSoftDeleteResponseDto } from "../dtos/responses/toggleOrSoftDelete";
import { Error } from "../models/error";
import { GetNotificationsResponseModel } from "../models/get-notifications-response";
import { Logger } from "../models/logger";
import { DynamoDbService } from "../services/aws/dynamoDB";
import { BradService } from "../services/databases/brad";
import { Helpers } from "../utils/helpers";

export class NotificationsApiService {
    private dynamoDBService: DynamoDbService;
    private bradService: BradService;
    private bradCache: NodeCache;
    private bradTableName: string;
    private bradCacheKey: string;
    private logger: winston.Logger;
    private stackTracey: StackTracey;
    private service: string;
    constructor() {
        this.dynamoDBService = new DynamoDbService();
        this.bradService = new BradService();
        this.bradCache = this.bradService.bradCache;
        this.bradTableName = DYNAMODB.TABLES.BRAD;
        this.bradCacheKey = `${this.bradTableName}_cache`;
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
    }
    public async getNotifications(params: GetNotificationsRequestDto): Promise<GetNotificationsResponseDto> {
        try {
            this.logger.info(`Service: ${this.getNotifications.name}`);

            const { id, client_id, createdDate, toDate, page, limit, read, order, isBatch, batch_id } = params;

            if (!this.bradCache.has(this.bradCacheKey)) await this.bradService.checkBradTable();

            const bradTableResults: any = this.bradCache.get(this.bradCacheKey);
            bradTableResults.Items = Helpers.filterNonDeletedNotifs(bradTableResults.Items);

            if (id || client_id) bradTableResults.Items = Helpers.filterNotifIdAndClientId(bradTableResults.Items, id, client_id);
            bradTableResults.Items = Helpers.filterIsBatchAndBatchId(bradTableResults.Items, isBatch, batch_id);

            const results: GetNotificationsResponseDto = new GetNotificationsResponseDto();
            results.results = bradTableResults.Items;

            // Date filters
            if (createdDate && toDate) {
                results.results = _.filter(results.results, (result: GetNotificationsResponseModel) => {
                    if (result.created_at) {
                        return (
                            moment(result.created_at, FORMATS.YYYYMMDD).isBetween(
                                moment(createdDate, FORMATS.YYYYMMDD),
                                moment(toDate, FORMATS.YYYYMMDD)
                            ) ||
                            result.created_at.includes(createdDate) ||
                            result.created_at.includes(toDate)
                        );
                    } else return false;
                });
            } else if (createdDate) {
                results.results = _.filter(results.results, (result: GetNotificationsResponseModel) => {
                    if (result.created_at) return result.created_at.includes(createdDate);
                    else return false;
                });
            }

            // Read filters
            if (read) {
                if (read.toLowerCase() == BOOLEAN.TRUE) results.results = _.filter(results.results, [DYNAMODB.BRAD_TABLE.KEYS.READ, true]);
                else if (read.toLowerCase() == BOOLEAN.FALSE)
                    results.results = _.filter(results.results, [DYNAMODB.BRAD_TABLE.KEYS.READ, false]);
                else results.results = _.filter(results.results, [DYNAMODB.BRAD_TABLE.KEYS.READ, read]);
            }

            // Order by asc or dec. Default is desc
            results.results = _.orderBy(results.results, (result: any) => new Date(result.created_at), [order]);

            if (isBatch) results.results = Helpers.convertJsonToArrayGroupByBatchId(results.results);

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            if (endIndex < results.results.length) {
                results.next = {
                    page: page + 1,
                    limit: limit
                };
            }
            if (startIndex > 0) {
                results.previous = {
                    page: page - 1,
                    limit: limit
                };
            }
            results.results = results.results.slice(startIndex, endIndex);
            return results;
        } catch (err) {
            throw err;
        }
    }

    public async saveNotifications(params: SaveNotificationsRequestDto): Promise<SaveNotificationsByBatchResponseDto> {
        try {
            this.logger.info(`Service: ${this.saveNotifications.name}`);

            const { id, client_id } = params;
            await this.dynamoDBService.putItem(this.bradTableName, params);
            const getNotificationsParams: GetNotificationsRequestDto = new GetNotificationsRequestDto();
            getNotificationsParams.id = id;
            getNotificationsParams.client_id = client_id;
            getNotificationsParams.isBatch = false;
            this.bradCache.del(this.bradCacheKey);
            const checkSavedNotif: GetNotificationsResponseDto = await this.getNotifications(getNotificationsParams);
            const response: SaveNotificationsResponseDto = new SaveNotificationsResponseDto();
            if (checkSavedNotif) {
                response.message = SUCCESS.SAVE_NOTIFICATIONS;
                response.results = checkSavedNotif.results;
            } else {
                response.message = FAILED.SAVE_NOTIFICATIONS;
                response.results = null;
                throw new Error(STATUS_CODES.SERVER_ERROR_RESPONSE.INTERNAL_SERVER_ERROR, response);
            }
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async saveNotificationsByBatch(
        params: SaveNotificationsByBatchRequestDto[],
        batch_id: string
    ): Promise<SaveNotificationsByBatchResponseDto> {
        try {
            this.logger.info(`Service: ${this.saveNotificationsByBatch.name}`);

            const getNotificationsParams: GetNotificationsRequestDto = new GetNotificationsRequestDto();
            getNotificationsParams.isBatch = true;
            getNotificationsParams.batch_id = batch_id;

            await this.bradService.writeNewItemsToAggregatedData(params);
            this.bradCache.del(this.bradCacheKey);
            const checkSavedNotif: GetNotificationsResponseDto = await this.getNotifications(getNotificationsParams);
            const response: SaveNotificationsByBatchResponseDto = new SaveNotificationsByBatchResponseDto();
            if (checkSavedNotif) {
                response.message = SUCCESS.SAVE_NOTIFICATIONS_BY_BATCH;
                response.results = checkSavedNotif.results;
            } else {
                response.message = FAILED.SAVE_NOTIFICATIONS_BY_BATCH;
                response.results = null;
                throw new Error(STATUS_CODES.SERVER_ERROR_RESPONSE.INTERNAL_SERVER_ERROR, response);
            }
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async toggleOrSoftDelete(params: ToggleOrSoftDeleteRequestDto, keyParam: string): Promise<ToggleOrSoftDeleteResponseDto> {
        try {
            this.logger.info(`Service: ${this.toggleOrSoftDelete.name}`);

            const { id, isBatch, batch_id } = params;
            const updated_at = Helpers.generateTimeNowInCustomFormat();
            let response: ToggleOrSoftDeleteResponseDto = new ToggleOrSoftDeleteResponseDto();
            if (!isBatch) {
                if (!isArray(id)) {
                    response = new ToggleOrSoftDeleteResponseDto(
                        keyParam == DYNAMODB.BRAD_TABLE.KEYS.READ ? SUCCESS.TOGGLE : SUCCESS.SOFT_DELETE,
                        [await this.bradService.updateReadOrDeletedAt(id, updated_at, keyParam)]
                    );
                } else if (isArray(id)) {
                    const ids = id;
                    const toggleMutipleResults: any[] = [];
                    for (const id of ids) {
                        toggleMutipleResults.push(await this.bradService.updateReadOrDeletedAt(id, updated_at, keyParam));
                    }
                    response = new ToggleOrSoftDeleteResponseDto(
                        keyParam == DYNAMODB.BRAD_TABLE.KEYS.READ ? SUCCESS.TOGGLE : SUCCESS.SOFT_DELETE,
                        toggleMutipleResults
                    );
                }
            } else {
                const ids = await this.bradService.fetchIdsOfBatchId(batch_id);
                const toggleMutipleResults: any[] = [];
                for (const id of ids) {
                    toggleMutipleResults.push(await this.bradService.updateReadOrDeletedAt(id, updated_at, keyParam));
                }
                response = new ToggleOrSoftDeleteResponseDto(
                    keyParam == DYNAMODB.BRAD_TABLE.KEYS.READ ? SUCCESS.TOGGLE : SUCCESS.SOFT_DELETE,
                    toggleMutipleResults
                );
            }
            return response;
        } catch (err: any) {
            throw err;
        }
    }
}
