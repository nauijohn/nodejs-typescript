import express from "express";
import _ from "lodash";
import moment from "moment";
import NodeCache from "node-cache";
import StackTracey from "stacktracey";
import winston from "winston";

import { DYNAMODB, FORMATS, STATUS_CODES } from "../constants/CONSTANTS.json";
import { DailyPerformanceRequestDto } from "../dtos/requests/daily-performance";
import { MonthPerformanceRequestDto } from "../dtos/requests/monthy-performance";
import { OriginVsDestinationVolumeRequestDto } from "../dtos/requests/origin-vs-destination-volume";
import { TicketCountHistoryRequestDto } from "../dtos/requests/ticket-count-history";
import { TicketsAssignedPerRiderRequestDto } from "../dtos/requests/tickets-assigned-per-rider";
import { DailyPerformanceResponseDto } from "../dtos/responses/daily-performance";
import { MonthPerformanceResponseDto } from "../dtos/responses/monthly-performance";
import { OriginVsDestinationVolumeResponseDto } from "../dtos/responses/origin-vs-destination-volume";
import { ReportsResponseDto } from "../dtos/responses/reports";
import { TicketCountHistoryResponseDto } from "../dtos/responses/ticket-count-history";
import { TicketsAssignedPerRiderResponseDto } from "../dtos/responses/tickets-assigned-per-rider";
import { Error } from "../models/error";
import { Logger } from "../models/logger";
import { DynamoDbService } from "../services/aws/dynamoDB";
import { AggregatedDataService } from "../services/databases/aggregated-data";
import { Helpers } from "../utils/helpers";

export class ReportsService {
    private aggregatedDataService: AggregatedDataService;
    private dynamoDBService: DynamoDbService;
    private logger: winston.Logger;
    private myCache: NodeCache;
    private service: string;
    private stackTracey: StackTracey;
    private aggregatedTableCacheKey: string;
    constructor() {
        this.aggregatedDataService = new AggregatedDataService();
        this.dynamoDBService = new DynamoDbService();
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
        this.myCache = this.aggregatedDataService.myCache;
        this.aggregatedTableCacheKey = `${DYNAMODB.TABLES.ABSI_AGGREGATED_DATA_PER_DAY}_cache`;
    }

    public async dateRangeMonthly(req: express.Request) {
        try {
            // get monthly date and count
            const tableName = DYNAMODB.TABLES.OLDDEV_BRAD_REQUESTS;
            const { filterExpression, expressionAttributeValues, projectionExpression } = req.body;
            const tableResults = (
                await this.dynamoDBService.scan(
                    tableName,
                    filterExpression,
                    expressionAttributeValues,
                    projectionExpression
                )
            ).data;

            const groupedByMonth = _.groupBy(
                tableResults.Items,
                (item) =>
                    `${new Date(item.createdAt).toLocaleString("default", { month: "long" })} ${new Date(
                        item.createdAt
                    ).getFullYear()}`
            );
            const groupedByMonthCount: any[] = [];
            const paramKeys = Object.keys(groupedByMonth);

            paramKeys.forEach((paramKey) => {
                groupedByMonthCount.push({
                    [paramKey]: groupedByMonth[paramKey].length,
                    items: groupedByMonth[paramKey]
                        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
                        .map((item) => ({
                            status: item.status,
                            createdAt: item.createdAt,
                            grandTotal: item.grandTotal
                        }))
                });
            });
            return groupedByMonthCount;

            // const targetTableName: string = DYNAMODB.TABLES.ABSI_AGGREGATED_DATA_PER_DAY;

            // if (!this.myCache.has(`${targetTableName}_cache`)) await this.checkSourceTable();
            // const sourceTableResults: any = this.myCache.get(`${targetTableName}_cache`);

            // return sourceTableResults;
        } catch (err) {
            console.log(err);
            throw new Error(STATUS_CODES.SERVER_ERROR_RESPONSE.INTERNAL_SERVER_ERROR, err);
        }
    }

    public async dailyDateRange(req: express.Request) {
        try {
            // get daily date data
            const tableName = DYNAMODB.TABLES.OLDDEV_BRAD_REQUESTS;
            const { filterExpression, expressionAttributeValues, projectionExpression } = req.body;
            const tableResults = (
                await this.dynamoDBService.scan(
                    tableName,
                    filterExpression,
                    expressionAttributeValues,
                    projectionExpression
                )
            ).data;

            const groupedbyDaily = _.groupBy(tableResults.Items, (item) => item.createdAt);

            const groupedByDailyCount: any[] = [];
            const paramKeys = Object.keys(groupedbyDaily);
            paramKeys.forEach((paramKey) => {
                groupedByDailyCount.push({
                    [paramKey]: groupedbyDaily[paramKey].length,
                    items: groupedbyDaily[paramKey]
                        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
                        .map((item) => ({
                            status: item.status,
                            createdAt: item.createdAt,
                            grandTotal: item.grandTotal
                        }))
                });
            });
            return groupedByDailyCount;
        } catch (err) {
            console.log(err);
            throw new Error(STATUS_CODES.SERVER_ERROR_RESPONSE.INTERNAL_SERVER_ERROR, err);
        }
    }

    public async perCategoryDaily(req: express.Request) {
        try {
            // daily data per category
            const tableName = DYNAMODB.TABLES.OLDDEV_BRAD_REQUESTS;
            const { filterExpression, expressionAttributeValues, projectionExpression } = req.body;
            const tableResults = (
                await this.dynamoDBService.scan(
                    tableName,
                    filterExpression,
                    expressionAttributeValues,
                    projectionExpression
                )
            ).data;

            const groupedbyCategory = _.groupBy(tableResults.Items, (item) => item.serviceType);

            const categories: any[] = [];
            const paramKeys = Object.keys(groupedbyCategory);
            paramKeys.forEach((paramKey) => {
                categories.push({
                    [paramKey]: groupedbyCategory[paramKey].length
                });
            });

            return categories;
        } catch (err) {
            console.log(err);
            throw new Error(STATUS_CODES.SERVER_ERROR_RESPONSE.INTERNAL_SERVER_ERROR, err);
        }
    }

    public async ticketCountHistory(params: TicketCountHistoryRequestDto): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Service: ${this.ticketCountHistory.name}`);
            const { page, limit, order, month, year, date, serviceType } = params;

            if (!this.myCache.has(this.aggregatedTableCacheKey)) await this.aggregatedDataService.checkSourceTable();
            const sourceTableResults: any = this.myCache.get(this.aggregatedTableCacheKey);

            let serviceTypeDispatchDateData: any[] = [];
            Helpers.putAllDataInArrayWithoutNoDeliveryDates(
                sourceTableResults.Items,
                serviceTypeDispatchDateData,
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.SERVICE_TYPE_DISPATCH_DATES
            );

            if (month || date || year) {
                serviceTypeDispatchDateData = _.filter(serviceTypeDispatchDateData, (item: any) => {
                    if (month && date && year) return item.dispatchDate.startsWith(`${month}/${date}/${year}`);
                    else if (month && date) return item.dispatchDate.startsWith(`${month}/${date}/`);
                    else if (date && year) return item.dispatchDate.endsWith(`/${date}/${year}`);
                    else if (month && year)
                        return item.dispatchDate.startsWith(`${month}/`) && item.dispatchDate.endsWith(`/${year}`);
                    else if (month) return item.dispatchDate.startsWith(`${month}/`);
                    else if (date) return item.dispatchDate.includes(`/${date}/`);
                    else if (year) return item.dispatchDate.endsWith(`/${year}`);
                });
            }

            let ticketCount: any[] = [];
            Helpers.sortServiceTypeDispatchDates(serviceTypeDispatchDateData, ticketCount, serviceType);

            const dateToday = new Date().toLocaleString().split(",")[0];
            const ticketToday = _.find(ticketCount, { dispatchDate: dateToday });

            // order
            ticketCount = _.orderBy(ticketCount, (result: any) => moment(result.dispatchDate, FORMATS.TIME.MMDDYYYY), [
                order
            ]);
            const response = new ReportsResponseDto();

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            if (endIndex < ticketCount.length) {
                response.next = {
                    page: page + 1,
                    limit: limit
                };
            }
            if (startIndex > 0) {
                response.previous = {
                    page: page - 1,
                    limit: limit
                };
            }
            ticketCount = ticketCount.slice(startIndex, endIndex);

            const results = new TicketCountHistoryResponseDto(
                ticketToday ? ticketToday.total : 0,
                sourceTableResults.Items.reduce((acc: any, obj: any) => acc + obj.completed, 0),
                sourceTableResults.Items.reduce((acc: any, obj: any) => acc + obj.pending, 0),
                sourceTableResults.Items.reduce((acc: any, obj: any) => acc + obj.in_progress, 0),
                sourceTableResults.Items.reduce((acc: any, obj: any) => acc + obj.delayed, 0),
                sourceTableResults.Items.reduce((acc: any, obj: any) => acc + obj.cancelled, 0),
                ticketCount
            );

            response.results = results;
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async ticketsAssignedPerRider(params: TicketsAssignedPerRiderRequestDto): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Service: ${this.ticketsAssignedPerRider.name}`);

            const { page, limit, order, month, year, date, peerAssigned } = params;

            if (!this.myCache.has(this.aggregatedTableCacheKey)) await this.aggregatedDataService.checkSourceTable();
            const sourceTableResults: any = this.myCache.get(this.aggregatedTableCacheKey);

            let peersAssignedData: any[] = [];
            Helpers.putAllDataInArrayWithoutNoDeliveryDates(
                sourceTableResults.Items,
                peersAssignedData,
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.PEERS_ASSIGNED
            );

            if (month || date || year) peersAssignedData = Helpers.filterDates(peersAssignedData, month, date, year);

            const resultsRiders: any = [];
            for (const item of peersAssignedData) {
                for (const item2 of item.peersAssigned) {
                    if (month || date || year) {
                        if (
                            !_.includes(
                                resultsRiders,
                                _.find(resultsRiders, {
                                    peerAssigned: item2.peerAssigned,
                                    dispatchDate: item.dispatchDate
                                })
                            )
                        )
                            resultsRiders.push({
                                peerAssigned: item2.peerAssigned,
                                dispatchDate: item.dispatchDate,
                                completed: item2.completed,
                                cancelled: item2.cancelled,
                                delayed: item2.delayed
                            });
                        else {
                            const indexOfRider = _.indexOf(
                                resultsRiders,
                                _.find(resultsRiders, {
                                    peerAssigned: item2.peerAssigned,
                                    dispatchDate: item.dispatchDate
                                })
                            );
                            resultsRiders[indexOfRider].completed += item2.completed;
                            resultsRiders[indexOfRider].cancelled += item2.cancelled;
                            resultsRiders[indexOfRider].delayed += item2.delayed;
                        }
                    } else {
                        if (!_.includes(resultsRiders, _.find(resultsRiders, { peerAssigned: item2.peerAssigned })))
                            resultsRiders.push({
                                peerAssigned: item2.peerAssigned,
                                dispatchDate: DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.ALL_TIME,
                                completed: item2.completed,
                                cancelled: item2.cancelled,
                                delayed: item2.delayed
                            });
                        else {
                            const indexOfRider = _.indexOf(
                                resultsRiders,
                                _.find(resultsRiders, { peerAssigned: item2.peerAssigned })
                            );
                            resultsRiders[indexOfRider].total += item2.total;
                            resultsRiders[indexOfRider].completed += item2.completed;
                            resultsRiders[indexOfRider].cancelled += item2.cancelled;
                            resultsRiders[indexOfRider].delayed += item2.delayed;
                        }
                    }
                }
            }

            const response: ReportsResponseDto = new ReportsResponseDto();
            response.results = resultsRiders.map(
                (rider: any) =>
                    new TicketsAssignedPerRiderResponseDto(
                        rider.peerAssigned,
                        rider.dispatchDate,
                        rider.completed,
                        rider.cancelled,
                        rider.delayed
                    )
            );

            // order
            response.results = _.orderBy(
                response.results,
                (result: any) => moment(result.dispatchDate, FORMATS.TIME.MMDDYYYY),
                [order]
            );

            // Filter peerAssigned
            if (peerAssigned) {
                response.results = _.filter(response.results, (result: any) =>
                    result.peerAssigned.includes(peerAssigned.toLowerCase())
                );
            }

            // Format peerAssigned so Pascal naming convention
            response.results.forEach((result: any) => {
                result.peerAssigned = result.peerAssigned
                    .split(" ")
                    .map((name: string) => name.charAt(0).toUpperCase() + name.slice(1))
                    .join(" ");
            });

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            if (endIndex < response.results.length) {
                response.next = {
                    page: page + 1,
                    limit: limit
                };
            }
            if (startIndex > 0) {
                response.previous = {
                    page: page - 1,
                    limit: limit
                };
            }
            response.results = response.results.slice(startIndex, endIndex);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async originVsDestinationVolume(params: OriginVsDestinationVolumeRequestDto): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Service: ${this.originVsDestinationVolume.name}`);
            const { month, year, date } = params;
            if (!this.myCache.has(this.aggregatedTableCacheKey)) await this.aggregatedDataService.checkSourceTable();
            const sourceTableResults: any = this.myCache.get(this.aggregatedTableCacheKey);

            let locationsData: any[] = [];
            Helpers.putAllDataInArrayWithoutNoDeliveryDates(
                sourceTableResults.Items,
                locationsData,
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.LOCATIONS
            );

            if (month || date || year) locationsData = Helpers.filterDates(locationsData, month, date, year);

            // maps
            const destinationLocations: string[] = [],
                originLocations: string[] = [];
            Helpers.getLocations(locationsData, destinationLocations, originLocations);

            const destinationMaps: any = {};
            const originMaps: any = {};
            Helpers.populateLocationsResults(
                locationsData,
                destinationLocations,
                originLocations,
                destinationMaps,
                originMaps
            );

            // order keys
            const orderedOriginMaps = Object.keys(originMaps)
                .sort()
                .reduce((obj: any, key: any) => {
                    obj[key] = originMaps[key];
                    return obj;
                }, {});
            const orderedDestinationMaps = Object.keys(destinationMaps)
                .sort()
                .reduce((obj: any, key: any) => {
                    obj[key] = destinationMaps[key];
                    return obj;
                }, {});

            let dispatchDate: string = "";
            if (!date && !month && !year) dispatchDate = DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.ALL_TIME;
            else if (!date && !month && year) dispatchDate = `${year}`;
            else if (!date && month && !year) dispatchDate = `${Helpers.decodeNumberToMonth(month)}`;
            else if (!date && month && year) dispatchDate = `${Helpers.decodeNumberToMonth(month)} ${year}`;
            else if (date && !month && !year) dispatchDate = `${date}`;
            else if (date && !month && year) dispatchDate = `${date} ${year}`;
            else if (date && month && !year) dispatchDate = `${Helpers.decodeNumberToMonth(month)} ${date}`;
            else if (date && month && year) dispatchDate = `${Helpers.decodeNumberToMonth(month)} ${date} ${year}`;

            const results: OriginVsDestinationVolumeResponseDto = new OriginVsDestinationVolumeResponseDto(
                dispatchDate,
                orderedOriginMaps,
                orderedDestinationMaps
            );

            const response: ReportsResponseDto = new ReportsResponseDto(null, null, results);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async monthlyPerformance(params: MonthPerformanceRequestDto): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Service: ${this.monthlyPerformance.name}`);

            const { month, year, toMonth, toYear, order } = params;
            if (!this.myCache.has(this.aggregatedTableCacheKey)) await this.aggregatedDataService.checkSourceTable();
            const sourceTableResults: any = this.myCache.get(this.aggregatedTableCacheKey);

            let categoryDispatchDatesData: any[] = [];
            Helpers.putAllDataInArrayWithoutNoDeliveryDates(
                sourceTableResults.Items,
                categoryDispatchDatesData,
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CATEGORY_DISPATCH_DATES
            );

            let dispatchDates: any[] = [];
            categoryDispatchDatesData.forEach((item: any) => {
                if (!_.includes(dispatchDates, _.find(dispatchDates, { dispatchDate: item.dispatchDate }))) {
                    dispatchDates.push({
                        dispatchDate: item.dispatchDate,
                        total: item.total,
                        completed: item.completed,
                        cancelled: item.cancelled
                    });
                } else {
                    const index = _.indexOf(dispatchDates, _.find(dispatchDates, { dispatchDate: item.dispatchDate }));
                    dispatchDates[index].total += item.total;
                    dispatchDates[index].completed += item.completed;
                    dispatchDates[index].cancelled += item.cancelled;
                }
            });

            if (month || year)
                dispatchDates = Helpers.filterDates(dispatchDates, month, null, year, toMonth, null, toYear);

            const existingYears: string[] = [];
            dispatchDates.forEach((item: any) => {
                const year = item.dispatchDate.split("/")[2];
                if (!existingYears.includes(year)) existingYears.push(year);
            });
            const existingMonths: string[] = [];
            for (const item of dispatchDates) {
                const month = item.dispatchDate.split("/")[0];
                if (existingMonths.length == 12) break;
                if (!existingMonths.includes(month)) existingMonths.push(month);
            }

            const monthYearItems: any[] = [];
            dispatchDates.forEach((item: any) => {
                const splitDispatchDate = item.dispatchDate.split("/");
                const monthSplit = splitDispatchDate[0];
                const yearSplit = splitDispatchDate[2];
                existingMonths.forEach((month: string) => {
                    existingYears.forEach((year: string) => {
                        if (monthSplit == month && yearSplit == year) {
                            if (
                                !_.includes(
                                    monthYearItems,
                                    _.find(monthYearItems, { dispatchDate: `${monthSplit}/${yearSplit}` })
                                )
                            )
                                monthYearItems.push({
                                    dispatchDate: `${monthSplit}/${yearSplit}`,
                                    total: item.total,
                                    completed: item.completed
                                });
                            else {
                                const indexOfMonthYear = _.indexOf(
                                    monthYearItems,
                                    _.find(monthYearItems, { dispatchDate: `${monthSplit}/${yearSplit}` })
                                );
                                monthYearItems[indexOfMonthYear].total += item.total;
                                monthYearItems[indexOfMonthYear].completed += item.completed;
                            }
                        }
                    });
                });
            });

            const results: any[] = [];
            monthYearItems.forEach((item: any) =>
                results.push(new MonthPerformanceResponseDto(item.dispatchDate, item.total, item.completed))
            );

            const response = new ReportsResponseDto();
            response.results = results;

            // order
            response.results = _.orderBy(
                response.results,
                (result: any) => moment(result.dispatchDate, FORMATS.TIME.MMYYYY),
                [order]
            );

            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async dailyPerformance(params: DailyPerformanceRequestDto): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Service: ${this.dailyPerformance.name}`);

            const { month, date, year, toMonth, toDate, toYear, category, order } = params;
            if (!this.myCache.has(this.aggregatedTableCacheKey)) await this.aggregatedDataService.checkSourceTable();
            const sourceTableResults: any = this.myCache.get(this.aggregatedTableCacheKey);

            let categoryDispatchDatesData: any[] = [];
            Helpers.putAllDataInArrayWithoutNoDeliveryDates(
                sourceTableResults.Items,
                categoryDispatchDatesData,
                DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.CATEGORY_DISPATCH_DATES
            );

            let ticketCount: any[] = [];
            Helpers.sortCategoryDispatchDates(categoryDispatchDatesData, ticketCount, category);

            if (month || date || year)
                ticketCount = Helpers.filterDates(ticketCount, month, date, year, toMonth, toDate, toYear);

            const existingYears: string[] = [];
            ticketCount.forEach((item: any) => {
                const year = item.dispatchDate.split("/")[2];
                if (!existingYears.includes(year)) existingYears.push(year);
            });
            const existingDays: string[] = [];
            for (const item of ticketCount) {
                const day = item.dispatchDate.split("/")[1];
                if (existingDays.length == 31) break;
                if (!existingDays.includes(day)) existingDays.push(day);
            }
            const existingMonths: string[] = [];
            for (const item of ticketCount) {
                const month = item.dispatchDate.split("/")[0];
                if (existingMonths.length == 12) break;
                if (!existingMonths.includes(month)) existingMonths.push(month);
            }
            const results: any[] = [];
            ticketCount.forEach((item: any) => {
                const splitDispatchDate = item.dispatchDate.split("/");
                const monthSplit = splitDispatchDate[0];
                const dateSplit = splitDispatchDate[1];
                const yearSplit = splitDispatchDate[2];
                existingYears.forEach((year: string) => {
                    existingMonths.forEach((month: string) => {
                        existingDays.forEach((date: string) => {
                            if (monthSplit == month && yearSplit == year && dateSplit == date) {
                                if (
                                    !_.includes(
                                        results,
                                        _.find(results, { dispatchDate: `${monthSplit}/${dateSplit}/${yearSplit}` })
                                    )
                                ) {
                                    results.push(
                                        new DailyPerformanceResponseDto(
                                            `${monthSplit}/${dateSplit}/${yearSplit}`,
                                            item.total,
                                            item.completed
                                        )
                                    );
                                } else {
                                    const indexOfMonthYear = _.indexOf(
                                        results,
                                        _.find(results, { dispatchDate: `${monthSplit}/${dateSplit}/${yearSplit}` })
                                    );
                                    results[indexOfMonthYear].totalCount += item.total;
                                    results[indexOfMonthYear].completed += item.completed;
                                }
                            }
                        });
                    });
                });
            });
            const response = new ReportsResponseDto();
            response.results = results;

            // order
            response.results = _.orderBy(
                response.results,
                (result: any) => moment(result.dispatchDate, FORMATS.TIME.MMDDYYYY),
                [order]
            );

            return response;
        } catch (err: any) {
            throw err;
        }
    }
}
