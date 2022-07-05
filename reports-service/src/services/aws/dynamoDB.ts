import { Converter } from "aws-sdk/clients/dynamodb";
import StackTracey from "stacktracey";
import winston from "winston";

import { DynamoDbApi } from "../../AWS/dynamoDB";
import { DYNAMODB, STATUS_CODES } from "../../constants/CONSTANTS.json";
import { Error } from "../../models/error";
import { Logger } from "../../models/logger";
import { Payload } from "../../models/payload";

export class DynamoDbService {
    private logger: winston.Logger;
    private service: string;
    private stackTracey: StackTracey;
    public dynamoDB: DynamoDbApi;
    constructor() {
        this.dynamoDB = new DynamoDbApi();
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
    }
    public async createTable(
        tableName: any,
        attributeDefinitions: any,
        keySchema: any,
        readCapacityUnits: any,
        writeCapacityUnits: any,
        streamEnabled: any
    ) {
        try {
            this.logger.info(`AWS Service: ${this.createTable.name}`);
            let params = {
                AttributeDefinitions: attributeDefinitions ? attributeDefinitions : null,
                KeySchema: keySchema ? keySchema : null,
                ProvisionedThroughput: {
                    ReadCapacityUnits: readCapacityUnits
                        ? readCapacityUnits
                        : DYNAMODB.DEFAULTS.CREATE.READ_CAPACITY_UNITS,
                    WriteCapacityUnits: writeCapacityUnits
                        ? writeCapacityUnits
                        : DYNAMODB.DEFAULTS.CREATE.WRITE_CAPACITY_UNITS
                },
                TableName: tableName ? tableName : null,
                StreamSpecification: {
                    StreamEnabled: streamEnabled ? streamEnabled : false
                }
            };
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.CREATED, await this.dynamoDB.createTable(params));
        } catch (err: any) {
            if (err.code == DYNAMODB.ERRORS.RESOURCE_IN_USER_EXCEPTION) {
                throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.CONFLICT, err);
            } else throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async listTables(limit: any) {
        try {
            this.logger.info(`AWS Service: ${this.listTables.name}`);

            let params = {
                Limit: limit ? limit : null
            };
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, await this.dynamoDB.listTables(params));
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async describeTable(tableName: string) {
        try {
            this.logger.info(`AWS Service: ${this.describeTable.name}`);

            let params = {
                TableName: tableName ? tableName : null
            };
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, await this.dynamoDB.describeTable(params));
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async putItem(tableName: string, item: any): Promise<Payload> {
        try {
            this.logger.info(`AWS Service: ${this.putItem.name}`);

            let params: any = {
                TableName: tableName ? tableName : null,
                Item: item ? Converter.marshall(item) : null
            };
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.CREATED, await this.dynamoDB.putItem(params));
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async getItem(tableName: any, key: any, projectionExpression?: any) {
        try {
            this.logger.info(`AWS Service: ${this.getItem.name}`);

            let params = {
                TableName: tableName ? tableName : null,
                Key: key ? Converter.marshall(key) : null,
                ProjectionExpression: projectionExpression ? projectionExpression : null
            };
            const result: any = await this.dynamoDB.getItem(params);
            result.Item = Converter.unmarshall(result.Item);
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.CREATED, result);
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async scan(
        tableName: string,
        filterExpression?: string | null,
        expressionAttributeValues?: any,
        projectionExpression?: string | null,
        exclusiveStartKey?: any,
        limit?: number
    ) {
        try {
            this.logger.info(`AWS Service: ${this.scan.name}`);

            let params = {
                FilterExpression: filterExpression ? filterExpression : null,
                ExpressionAttributeValues: expressionAttributeValues
                    ? Converter.marshall(expressionAttributeValues)
                    : null,
                ProjectionExpression: projectionExpression ? projectionExpression : null,
                TableName: tableName ? tableName : null,
                Limit: limit ? limit : null,
                ExclusiveStartKey: exclusiveStartKey ? Converter.marshall(exclusiveStartKey) : null
            };
            const result: any = await this.dynamoDB.scan(params);
            result.Items = result.Items.map((item: any) => Converter.unmarshall(item));
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, result);
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async query(
        tableName: any,
        filterExpression: any,
        expressionAttributeValues: any,
        projectionExpression: any,
        keyConditionExpression: any
    ) {
        try {
            this.logger.info(`AWS Service: ${this.query.name}`);

            let params = {
                ExpressionAttributeValues: expressionAttributeValues ? expressionAttributeValues : null,
                KeyConditionExpression: keyConditionExpression ? keyConditionExpression : null,
                ProjectionExpression: projectionExpression ? projectionExpression : null,
                FilterExpression: filterExpression ? filterExpression : null,
                TableName: tableName ? tableName : null
            };
            const result: any = await this.dynamoDB.query(params);
            result.Items = result.Items.map((item: any) => Converter.unmarshall(item));
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.CREATED, result);
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async batchWriteItems(tableName: string, params: any) {
        try {
            this.logger.info(`AWS Service: ${this.batchWriteItems.name}`);

            params.RequestItems[tableName].forEach((requestItem: any) => {
                requestItem.PutRequest.Item = Converter.marshall(requestItem.PutRequest.Item);
            });
            const result: any = await this.dynamoDB.batchWriteItems(params);
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.CREATED, result);
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async updateItem(
        tableName: string,
        expressionAttributeNames: any,
        expressionAttributeValues: any,
        key: any,
        updateExpression: any,
        returnValues: any
    ) {
        try {
            this.logger.info(`AWS Service: ${this.updateItem.name}`);

            const params = {
                ExpressionAttributeValues: expressionAttributeValues
                    ? Converter.marshall(expressionAttributeValues)
                    : null,
                ExpressionAttributeNames: expressionAttributeNames ? expressionAttributeNames : null,
                UpdateExpression: updateExpression ? updateExpression : null,
                Key: key ? Converter.marshall(key) : null,
                TableName: tableName ? tableName : null,
                ReturnValues: returnValues ? returnValues : null
            };
            const result: any = await this.dynamoDB.updateItem(params);
            result.Attributes = Converter.unmarshall(result.Attributes);
            return result;
        } catch (err: any) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async getScannedCount(
        tableName: string,
        filterExpression?: string | null,
        expressionAttributeValues?: any,
        projectionExpression?: string | null,
        exclusiveStartKey?: any,
        limit?: number
    ) {
        try {
            this.logger.info(`AWS Service: ${this.getScannedCount.name}`);

            let params = {
                FilterExpression: filterExpression ? filterExpression : null,
                ExpressionAttributeValues: expressionAttributeValues
                    ? Converter.marshall(expressionAttributeValues)
                    : null,
                ProjectionExpression: projectionExpression ? projectionExpression : null,
                TableName: tableName ? tableName : null,
                ExclusiveStartKey: exclusiveStartKey ? Converter.marshall(exclusiveStartKey) : null,
                Limit: limit ? limit : null
            };
            const result: any = await this.dynamoDB.scannedCount(params);
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, result);
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async getCount(
        tableName: string,
        filterExpression?: string | null,
        expressionAttributeValues?: any,
        projectionExpression?: string | null,
        exclusiveStartKey?: any,
        limit?: number
    ) {
        try {
            this.logger.info(`AWS Service: ${this.getCount.name}`);

            let params = {
                FilterExpression: filterExpression ? filterExpression : null,
                ExpressionAttributeValues: expressionAttributeValues
                    ? Converter.marshall(expressionAttributeValues)
                    : null,
                ProjectionExpression: projectionExpression ? projectionExpression : null,
                TableName: tableName ? tableName : null,
                ExclusiveStartKey: exclusiveStartKey ? Converter.marshall(exclusiveStartKey) : null,
                Limit: limit ? limit : null
            };
            const result: any = await this.dynamoDB.count(params);
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, result);
        } catch (err) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async scanAll(tableName: string, filterExpression?: string, expressionAttributeValues?: any) {
        try {
            this.logger.info(`AWS Service: ${this.scanAll.name}`);

            const items: any = [],
                results: any = {};
            let scanResults: Payload,
                exclusiveStartKey: any = null,
                count = 0,
                scannedCount = 0,
                stopper = true;
            do {
                scanResults = await this.scan(
                    tableName,
                    filterExpression,
                    expressionAttributeValues,
                    null,
                    exclusiveStartKey
                );
                items.push(...scanResults.data.Items);
                count += scanResults.data.Count;
                scannedCount += scanResults.data.ScannedCount;
                exclusiveStartKey = Converter.unmarshall(scanResults.data.LastEvaluatedKey);
                if (scanResults.data.LastEvaluatedKey == null) stopper = false;
            } while (stopper);
            results.Items = items;
            results.Count = count;
            results.ScannedCount = scannedCount;
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, results);
        } catch (err: any) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }

    public async getScannedCountAll(tableName: string, filterExpression?: string, expressionAttributeValues?: any) {
        try {
            this.logger.info(`AWS Service: ${this.getScannedCountAll.name}`);

            const results: any = {};
            let scanResults: Payload,
                exclusiveStartKey: any = null,
                scannedCount = 0,
                stopper = true;
            do {
                scanResults = await this.getScannedCount(
                    tableName,
                    filterExpression,
                    expressionAttributeValues,
                    null,
                    exclusiveStartKey
                );
                scannedCount += scanResults.data.ScannedCount;
                exclusiveStartKey = Converter.unmarshall(scanResults.data.LastEvaluatedKey);
                if (scanResults.data.LastEvaluatedKey == null) stopper = false;
            } while (stopper);
            results.ScannedCount = scannedCount;
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, results);
        } catch (err: any) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }
    public async getCountAll(tableName: string, filterExpression?: string, expressionAttributeValues?: any) {
        try {
            this.logger.info(`AWS Service: ${this.getCountAll.name}`);

            const results: any = {};
            let scanResults: Payload,
                exclusiveStartKey: any = null,
                count = 0,
                stopper = true;
            do {
                scanResults = await this.getCount(
                    tableName,
                    filterExpression,
                    expressionAttributeValues,
                    null,
                    exclusiveStartKey
                );
                count += scanResults.data.Count;
                exclusiveStartKey = Converter.unmarshall(scanResults.data.LastEvaluatedKey);
                if (scanResults.data.LastEvaluatedKey == null) stopper = false;
            } while (stopper);
            results.Count = count;
            return new Payload(STATUS_CODES.SUCCESSFUL_RESPONSE.OK, results);
        } catch (err: any) {
            throw new Error(STATUS_CODES.CLIENT_ERROR_RESPONSE.BAD_REQUEST, err);
        }
    }
}
