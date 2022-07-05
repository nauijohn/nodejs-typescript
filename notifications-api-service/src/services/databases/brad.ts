import { Converter } from "aws-sdk/clients/dynamodb";
import config from "config";
import fs from "fs";
import NodeCache from "node-cache";
import path from "path";
import StackTracey from "stacktracey";
import winston from "winston";

import { CONFIG, DYNAMODB } from "../../constants/CONSTANTS.json";
import { Logger } from "../../models/logger";
import { Helpers } from "../../utils/helpers";
import { DynamoDbService } from "../aws/dynamoDB";

export class BradService {
    public bradCache: NodeCache;
    private dynamoDBService: DynamoDbService;
    private bradTableName: string;
    private bradCacheKey: string;
    private logger: winston.Logger;
    private stackTracey: StackTracey;
    private service: string;
    constructor() {
        this.bradCache = new NodeCache();
        this.dynamoDBService = new DynamoDbService();
        this.bradTableName = DYNAMODB.TABLES.BRAD;
        this.bradCacheKey = `${this.bradTableName}_cache`;
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
    }
    public async checkBradTable() {
        try {
            this.logger.info(`Service: ${this.checkBradTable.name}`);

            const filterExpression: string = "lookup_key = :lookup_key",
                expressionAttributeValues: any = {};
            expressionAttributeValues[":lookup_key"] = "NOTIF";
            const scannedCountOfTable = (
                await this.dynamoDBService.getCountAll(this.bradTableName, filterExpression, expressionAttributeValues)
            ).data.Count;

            const lastScannedCount: any = await new Promise((res, rej) => {
                fs.readFile(path.resolve("./last-scanned-count.txt"), "utf8", (err, data) => {
                    if (err) rej(err);
                    else res(data);
                });
            });

            if (scannedCountOfTable != parseInt(lastScannedCount)) {
                this.logger.info("Changes in last scanned count");
                this.logger.info("Refreshing cache...");
                const latestBradTableResults = (
                    await this.dynamoDBService.scanAll(this.bradTableName, filterExpression, expressionAttributeValues)
                ).data;
                this.bradCache.set(this.bradCacheKey, latestBradTableResults, config.get(CONFIG.CACHE.TTL));
                fs.writeFile(path.resolve("./last-scanned-count.txt"), String(scannedCountOfTable), (err) => {
                    if (err) throw err;
                });
            } else {
                this.logger.info("No changes in last scanned count...");
                this.logger.info("Checking if cache is still alive...");

                if (!this.bradCache.has(this.bradCacheKey)) {
                    this.logger.info("Refreshing cache...");
                    const latestBradTableResults = (
                        await this.dynamoDBService.scanAll(this.bradTableName, filterExpression, expressionAttributeValues)
                    ).data;
                    this.bradCache.set(this.bradCacheKey, latestBradTableResults, config.get(CONFIG.CACHE.TTL));
                    fs.writeFile(path.resolve("./last-scanned-count.txt"), String(scannedCountOfTable), (err) => {
                        if (err) throw err;
                    });
                } else this.logger.info("Cache is still alive...");
            }
        } catch (err: any) {
            throw err;
        }
    }

    public async updateReadOrDeletedAt(id: string | null, updated_at: string, keyParam: string) {
        try {
            this.logger.info(`Service: ${this.updateReadOrDeletedAt.name}`);

            const expressionAttributeNames: any = {},
                expressionAttributeValues: any = {},
                key: any = {};
            let returnValues: string = "",
                updateExpression: string = "";
            key.reference_key = `NOTIF:${id}`;
            key.lookup_key = "NOTIF";
            expressionAttributeNames[`#${keyParam}`] = `${keyParam}`;
            expressionAttributeValues[`:${keyParam}`] = keyParam == DYNAMODB.BRAD_TABLE.KEYS.READ ? true : updated_at;
            expressionAttributeNames[`#${DYNAMODB.BRAD_TABLE.KEYS.UPDATED_AT}`] = DYNAMODB.BRAD_TABLE.KEYS.UPDATED_AT;
            expressionAttributeValues[`:${DYNAMODB.BRAD_TABLE.KEYS.UPDATED_AT}`] = updated_at;
            updateExpression += `SET #${keyParam} = :${keyParam}, #${DYNAMODB.BRAD_TABLE.KEYS.UPDATED_AT} = :${DYNAMODB.BRAD_TABLE.KEYS.UPDATED_AT}`;
            returnValues += "ALL_NEW";

            const doesIdExist = (await this.dynamoDBService.getItem(this.bradTableName, key)).data.Item;
            if (Object.keys(doesIdExist).length != 0) {
                const hasAlreadyBeenUpdated = keyParam == DYNAMODB.BRAD_TABLE.KEYS.READ ? doesIdExist.read : doesIdExist.deleted_at;
                if (keyParam == DYNAMODB.BRAD_TABLE.KEYS.READ) {
                    if (hasAlreadyBeenUpdated) return `Notif_id:${id} has already been toggled on ${doesIdExist.updated_at}.`;
                    else
                        return (
                            await this.dynamoDBService.updateItem(
                                this.bradTableName,
                                expressionAttributeNames,
                                expressionAttributeValues,
                                key,
                                updateExpression,
                                returnValues
                            )
                        ).Attributes;
                } else {
                    if (hasAlreadyBeenUpdated != undefined)
                        return `Notif_id:${id} has already been soft deleted on ${doesIdExist.updated_at}.`;
                    else
                        return (
                            await this.dynamoDBService.updateItem(
                                this.bradTableName,
                                expressionAttributeNames,
                                expressionAttributeValues,
                                key,
                                updateExpression,
                                returnValues
                            )
                        ).Attributes;
                }
            } else return `Notifications for notif_id:${id} does not exists.`;
        } catch (err) {
            throw err;
        }
    }

    public async writeNewItemsToAggregatedData(newItems: any) {
        try {
            this.logger.info(`Service: ${this.writeNewItemsToAggregatedData.name}`);

            const requestItems = Helpers.generateRequestItems(newItems, this.bradTableName);
            if (requestItems.RequestItems[this.bradTableName].length > 25) {
                let requestItems25 = [],
                    counter = 0;

                for (const requestItem of requestItems.RequestItems[this.bradTableName]) {
                    counter++;
                    requestItems25.push(requestItem);
                    if (requestItems25.length == 25) {
                        const requestItems25Trans = {
                            RequestItems: {
                                [this.bradTableName]: requestItems25
                            }
                        };
                        await this.dynamoDBService.batchWriteItems(this.bradTableName, requestItems25Trans);
                        requestItems25 = [];
                    }
                    if (counter == requestItems.RequestItems[this.bradTableName].length) {
                        const requestItems25Trans = {
                            RequestItems: {
                                [this.bradTableName]: requestItems25
                            }
                        };
                        await this.dynamoDBService.batchWriteItems(this.bradTableName, requestItems25Trans);
                        requestItems25 = [];
                    }
                }
            } else if (requestItems.RequestItems[this.bradTableName].length == 1)
                await this.dynamoDBService.putItem(this.bradTableName, newItems[0]);
            else await this.dynamoDBService.batchWriteItems(this.bradTableName, requestItems);

            const transformRequestItems = requestItems.RequestItems[this.bradTableName].map((item: any) =>
                Converter.unmarshall(item.PutRequest.Item)
            );
            return transformRequestItems;
        } catch (err: any) {
            throw err;
        }
    }

    public async fetchIdsOfBatchId(batch_id: string | null) {
        try {
            this.logger.info(`Service: ${this.fetchIdsOfBatchId.name}`);

            const filterExpression: string = `batch_id = :batch_id`;
            const expressionAttributeValues: any = {
                [":batch_id"]: batch_id
            };
            const results = await this.dynamoDBService.scanAll(this.bradTableName, filterExpression, expressionAttributeValues);
            const idsOfBatchId = [];
            for (const item of results.data.Items) {
                idsOfBatchId.push(item.id);
            }
            return idsOfBatchId;
        } catch (err: any) {
            throw err;
        }
    }
}
