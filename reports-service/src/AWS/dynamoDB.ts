import AWS from "aws-sdk";
import config from "config";

import { CONFIG } from "../constants/CONSTANTS.json";

export class DynamoDbApi {
    private ddb: AWS.DynamoDB;
    constructor() {
        this.ddb = new AWS.DynamoDB({
            apiVersion: config.get(CONFIG.AWS.API_VERSION.DYNAMODB),
            region: config.get(CONFIG.AWS.REGIONS.SINGAPORE)
        });
    }

    public createTable(params: any) {
        return new Promise((res, rej) => {
            this.ddb.createTable(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public listTables(params: any) {
        return new Promise((res, rej) => {
            this.ddb.listTables(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public describeTable(params: any) {
        return new Promise((res, rej) => {
            this.ddb.describeTable(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public putItem(params: any) {
        return new Promise((res, rej) => {
            this.ddb.putItem(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public getItem(params: any) {
        return new Promise((res, rej) => {
            this.ddb.getItem(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public scan(params: any) {
        return new Promise((res, rej) => {
            this.ddb.scan(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public scannedCount(params: any) {
        return new Promise((res, rej) => {
            this.ddb.scan(params, (err: any, data: any) => {
                if (err) rej(err);
                else res({ ScannedCount: data.ScannedCount, LastEvaluatedKey: data.LastEvaluatedKey });
            });
        });
    }

    public count(params: any) {
        return new Promise((res, rej) => {
            this.ddb.scan(params, (err: any, data: any) => {
                if (err) rej(err);
                else res({ Count: data.Count, LastEvaluatedKey: data.LastEvaluatedKey });
            });
        });
    }

    public query(params: any) {
        return new Promise((res, rej) => {
            this.ddb.query(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public batchWriteItems(params: any) {
        return new Promise((res, rej) => {
            this.ddb.batchWriteItem(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }

    public updateItem(params: any) {
        return new Promise((res, rej) => {
            this.ddb.updateItem(params, (err: any, data: any) => {
                if (err) rej(err);
                else res(data);
            });
        });
    }
}
