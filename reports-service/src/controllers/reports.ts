import express from "express";
import StackTracey from "stacktracey";
import winston from "winston";

import { DailyPerformanceRequestDto } from "../dtos/requests/daily-performance";
import { MonthPerformanceRequestDto } from "../dtos/requests/monthy-performance";
import { OriginVsDestinationVolumeRequestDto } from "../dtos/requests/origin-vs-destination-volume";
import { TicketCountHistoryRequestDto } from "../dtos/requests/ticket-count-history";
import { TicketsAssignedPerRiderRequestDto } from "../dtos/requests/tickets-assigned-per-rider";
import { ReportsResponseDto } from "../dtos/responses/reports";
import { Logger } from "../models/logger";
import { ReportsService } from "../services/reports";

export class ReportsController {
    private logger: winston.Logger;
    private reportsService: ReportsService;
    private service: string;
    private stackTracey: StackTracey;
    constructor() {
        this.stackTracey = new StackTracey();
        this.service = this.stackTracey.items[0].callee.replace("new ", "");
        this.logger = Logger.getLogger(this.service);
        this.reportsService = new ReportsService();
    }
    public async ticketCountHistory(req: express.Request): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Controller: ${this.ticketCountHistory.name}`);
            const { order, page, limit, month, year, date, serviceType } = req.query;
            const params: TicketCountHistoryRequestDto = new TicketCountHistoryRequestDto(
                page,
                limit,
                order,
                month,
                year,
                date,
                serviceType
            );
            const result: ReportsResponseDto = await this.reportsService.ticketCountHistory(params);
            return result;
        } catch (err: any) {
            throw err;
        }
    }

    public async ticketsAssignedPerRider(req: express.Request): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Controller: ${this.ticketsAssignedPerRider.name}`);
            const { peerAssigned, order, page, limit, month, year, date } = req.query;
            const params: TicketsAssignedPerRiderRequestDto = new TicketsAssignedPerRiderRequestDto(
                page,
                limit,
                peerAssigned,
                order,
                month,
                year,
                date
            );
            const response: ReportsResponseDto = await this.reportsService.ticketsAssignedPerRider(params);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async originVsDestinationVolume(req: express.Request): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Controller: ${this.originVsDestinationVolume.name}`);
            const { month, year, date } = req.query;
            const params: OriginVsDestinationVolumeRequestDto = new OriginVsDestinationVolumeRequestDto(
                month,
                year,
                date
            );
            const response: ReportsResponseDto = await this.reportsService.originVsDestinationVolume(params);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async dateRangeMonthly(req: express.Request, res: express.Response) {
        try {
            const response = await this.reportsService.dateRangeMonthly(req);
            res.status(200).send(response);
        } catch (err: any) {
            res.send(err);
        }
    }

    public async dailyDateRange(req: express.Request, res: express.Response) {
        try {
            const response = await this.reportsService.dailyDateRange(req);
            res.status(200).send(response);
        } catch (err: any) {
            res.send(err);
        }
    }

    public async perCategoryDaily(req: express.Request, res: express.Response) {
        try {
            const response = await this.reportsService.perCategoryDaily(req);
            res.status(200).send(response);
        } catch (err: any) {
            res.send(err);
        }
    }

    public async monthlyPerformance(req: express.Request) {
        try {
            this.logger.info(`Controller: ${this.monthlyPerformance.name}`);
            const { month, year, toMonth, toYear, order } = req.query;
            const params: MonthPerformanceRequestDto = new MonthPerformanceRequestDto(
                month,
                year,
                toMonth,
                toYear,
                order
            );
            const response: ReportsResponseDto = await this.reportsService.monthlyPerformance(params);
            return response;
        } catch (err: any) {
            throw err;
        }
    }

    public async dailyPerformance(req: express.Request): Promise<ReportsResponseDto> {
        try {
            this.logger.info(`Controller: ${this.dailyPerformance.name}`);
            const { month, year, date, toMonth, toYear, toDate, category, order } = req.query;
            const params: DailyPerformanceRequestDto = new DailyPerformanceRequestDto(
                month,
                date,
                year,
                toMonth,
                toDate,
                toYear,
                category,
                order
            );
            const response: ReportsResponseDto = await this.reportsService.dailyPerformance(params);
            return response;
        } catch (err: any) {
            throw err;
        }
    }
}
