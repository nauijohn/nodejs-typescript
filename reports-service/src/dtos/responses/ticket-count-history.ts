export class TicketCountHistoryResponseDto {
    public totalTicketsToday: number;
    public completed: number;
    public pending: number;
    public in_progress: number;
    public delayed: number;
    public cancelled: number;
    public ticketCount: any;

    constructor(
        totalTicketsToday?: number,
        completed?: number,
        pending?: number,
        in_progress?: number,
        delayed?: number,
        cancelled?: number,
        ticketCount?: any
    ) {
        this.totalTicketsToday = totalTicketsToday ?? 0;
        this.completed = completed ?? 0;
        this.pending = pending ?? 0;
        this.in_progress = in_progress ?? 0;
        this.delayed = delayed ?? 0;
        this.cancelled = cancelled ?? 0;
        this.ticketCount = ticketCount;
    }
}
