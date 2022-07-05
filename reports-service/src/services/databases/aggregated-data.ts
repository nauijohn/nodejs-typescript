import { Converter } from "aws-sdk/clients/dynamodb";
import config from "config";
import fs from "fs";
import _ from "lodash";
import NodeCache from "node-cache";
import path from "path";
import StackTracey from "stacktracey";
import winston from "winston";

import { CONFIG, DYNAMODB } from "../../constants/CONSTANTS.json";
import { Logger } from "../../models/logger";
import { DynamoDbService } from "../../services/aws/dynamoDB";
import { Helpers } from "../../utils/helpers";

export class AggregatedDataService {
    public myCache: NodeCache;
    private dynamoDBService: DynamoDbService;
    private logger: winston.Logger;
    private service: string;
    private stackTracey: StackTracey;
    private nameOfDestinationTable: string;
    private nameOfSourceTable: string;
    private cacheKeyName: string;

    constructor() {
        this.dynamoDBService = new DynamoDbService();
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
        this.myCache = new NodeCache();
        this.nameOfDestinationTable = DYNAMODB.TABLES.ABSI_AGGREGATED_DATA_PER_DAY;
        this.nameOfSourceTable = DYNAMODB.TABLES.OLDDEV_BRAD_REQUESTS;
        this.cacheKeyName = `${this.nameOfDestinationTable}_cache`;
    }
    public async checkSourceTable() {
        try {
            this.logger.info(`Service: ${this.checkSourceTable.name}`);

            const scannedCountOfTable = (await this.dynamoDBService.getScannedCountAll(this.nameOfSourceTable)).data
                .ScannedCount;
            const lastScannedCount: any = await new Promise((res, rej) => {
                fs.readFile(path.resolve("./last-scanned-count.txt"), "utf8", (err, data) => {
                    if (err) rej(err);
                    else res(data);
                });
            });
            if (parseInt(String(lastScannedCount)) != scannedCountOfTable) {
                const [sourceTableResults, destinationTableResults] = await Promise.all([
                    this.dynamoDBService.scanAll(this.nameOfSourceTable),
                    this.dynamoDBService.scanAll(this.nameOfDestinationTable)
                ]);

                const [sourceResults, destinationResults] = Helpers.differenceWithParams(
                    sourceTableResults.data,
                    destinationTableResults.data.Items
                );

                const difference = _.differenceWith(sourceResults, destinationResults, _.isEqual);
                if (difference.length != 0) {
                    const updateItems = Helpers.determineUpdateItems(destinationResults, difference);
                    const newItems = difference;
                    let newWrittenItems: any = [];
                    if (newItems.length != 0) newWrittenItems = await this.writeNewItemsToAggregatedData(newItems);
                    const updatedItems: any = [];
                    if (updateItems.length != 0) {
                        for (const updateItem of updateItems) {
                            updatedItems.push((await this.updateAggregatedData(updateItem)).Attributes);
                        }
                    }
                    if (newWrittenItems.length != 0 || updatedItems.length != 0) {
                        this.logger.info("Updates detected...");
                        this.logger.info(`There are ${newWrittenItems.length} new items written`);
                        this.logger.info(`There are ${updatedItems.length} items updated`);
                        this.logger.info("Refereshing cache...");

                        const latestTargetTableResults = (
                            await this.dynamoDBService.scanAll(this.nameOfDestinationTable)
                        ).data;
                        this.myCache.set(this.cacheKeyName, latestTargetTableResults, config.get(CONFIG.CACHE.TTL));
                        fs.writeFile(path.resolve("./last-scanned-count.txt"), String(scannedCountOfTable), (err) => {
                            if (err) throw err;
                        });
                    } else {
                        this.logger.info("No updates in table...");

                        if (!this.myCache.has(this.cacheKeyName)) {
                            this.logger.info("Refereshing cache...");

                            const latestTargetTableResults = (
                                await this.dynamoDBService.scanAll(this.nameOfDestinationTable)
                            ).data;
                            this.myCache.set(this.cacheKeyName, latestTargetTableResults, config.get(CONFIG.CACHE.TTL));
                            fs.writeFile(
                                path.resolve("./last-scanned-count.txt"),
                                String(scannedCountOfTable),
                                (err) => {
                                    if (err) throw err;
                                }
                            );
                        } else this.logger.info("Cache is still alive...");
                    }
                } else {
                    this.logger.info("No difference in table data...");

                    if (!this.myCache.has(this.cacheKeyName)) {
                        this.logger.info("Refereshing cache...");

                        const latestTargetTableResults = (
                            await this.dynamoDBService.scanAll(this.nameOfDestinationTable)
                        ).data;
                        this.myCache.set(this.cacheKeyName, latestTargetTableResults, config.get(CONFIG.CACHE.TTL));
                        fs.writeFile(path.resolve("./last-scanned-count.txt"), String(scannedCountOfTable), (err) => {
                            if (err) throw err;
                        });
                    } else this.logger.info("Cache is still alive...");
                }
            } else {
                this.logger.info("No difference in ScannedCount...");
                this.logger.info("Checking if cache is still alive...");

                if (!this.myCache.has(this.cacheKeyName)) {
                    this.logger.info("Refereshing cache...");

                    const latestTargetTableResults = (await this.dynamoDBService.scanAll(this.nameOfDestinationTable))
                        .data;
                    this.myCache.set(this.cacheKeyName, latestTargetTableResults, config.get(CONFIG.CACHE.TTL));
                    fs.writeFile(path.resolve("./last-scanned-count.txt"), String(scannedCountOfTable), (err) => {
                        if (err) throw err;
                    });
                } else this.logger.info("Cache is still alive...");
            }
        } catch (err: any) {
            throw err;
        }
    }

    private async updateAggregatedData(updateItem: any) {
        try {
            this.logger.info(`Service: ${this.updateAggregatedData.name}`);

            const expressionAttributeNames: any = {},
                expressionAttributeValues: any = {},
                key: any = {},
                returnValues: string = "ALL_NEW",
                updateExpression: string = DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.UPDATE_EXPRESSION;

            key.ticketCreatedAt = updateItem.ticketCreatedAt;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.TOTAL}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.TOTAL;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.TOTAL}`] = updateItem.total;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.COMPLETED}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.COMPLETED;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.COMPLETED}`] =
                updateItem.completed;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CANCELLED}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CANCELLED;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CANCELLED}`] =
                updateItem.cancelled;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DELAYED}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DELAYED;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DELAYED}`] = updateItem.delayed;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.IN_PROGRESS}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.IN_PROGRESS;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.IN_PROGRESS}`] =
                updateItem.in_progress;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.UPDATED_AT}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.UPDATED_AT;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.UPDATED_AT}`] =
                Helpers.generateTimeNowInCustomFormat();
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PENDING}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PENDING;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PENDING}`] = updateItem.pending;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PEERS_ASSIGNED}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PEERS_ASSIGNED;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PEERS_ASSIGNED}`] =
                updateItem.peersAssigned;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.SERVICE_TYPE_DISPATCH_DATES}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.SERVICE_TYPE_DISPATCH_DATES;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.SERVICE_TYPE_DISPATCH_DATES}`] =
                updateItem.serviceTypeDispatchDates;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CATEGORY_DISPATCH_DATES}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CATEGORY_DISPATCH_DATES;
            expressionAttributeValues[`:${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CATEGORY_DISPATCH_DATES}`] =
                updateItem.categoryDispatchDates;
            expressionAttributeNames[`#${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.LOCATIONS}`] =
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.LOCATIONS;
            expressionAttributeValues[`${DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.LOCATIONS}`] = updateItem.locations;

            return await this.dynamoDBService.updateItem(
                this.nameOfDestinationTable,
                expressionAttributeNames,
                expressionAttributeValues,
                key,
                updateExpression,
                returnValues
            );
        } catch (err: any) {
            throw err;
        }
    }

    private async writeNewItemsToAggregatedData(newItems: any) {
        try {
            this.logger.info(`Service: ${this.writeNewItemsToAggregatedData.name}`);

            const requestItems = Helpers.generateRequestItemsForBatchWrite(this.nameOfDestinationTable, newItems);
            console.log(requestItems);
            if (requestItems.RequestItems[this.nameOfDestinationTable].length > 25) {
                let requestItems25 = [],
                    counter = 0;

                for (const requestItem of requestItems.RequestItems[this.nameOfDestinationTable]) {
                    counter++;
                    requestItems25.push(requestItem);
                    if (requestItems25.length == 25) {
                        const requestItems25Trans = {
                            RequestItems: {
                                [this.nameOfDestinationTable]: requestItems25
                            }
                        };
                        await this.dynamoDBService.batchWriteItems(this.nameOfDestinationTable, requestItems25Trans);
                        requestItems25 = [];
                    }
                    if (counter == requestItems.RequestItems[this.nameOfDestinationTable].length) {
                        if (requestItems25.length != 0) {
                            const requestItems25Trans = {
                                RequestItems: {
                                    [this.nameOfDestinationTable]: requestItems25
                                }
                            };
                            await this.dynamoDBService.batchWriteItems(
                                this.nameOfDestinationTable,
                                requestItems25Trans
                            );
                            requestItems25 = [];
                        }
                    }
                }
            } else await this.dynamoDBService.batchWriteItems(this.nameOfDestinationTable, requestItems);

            const transformRequestItems = requestItems.RequestItems[this.nameOfDestinationTable].map((item: any) =>
                Converter.unmarshall(item.PutRequest.Item)
            );
            return transformRequestItems;
        } catch (err: any) {
            throw err;
        }
    }
}
