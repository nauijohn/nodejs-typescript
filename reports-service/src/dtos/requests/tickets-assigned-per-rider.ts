export class TicketsAssignedPerRiderRequestDto {
    public page: number;
    public limit: number;
    public peerAssigned: string;
    public order?: any;
    public month: number | null;
    public year: number | null;
    public date: number | null;
    constructor(page?: any, limit?: any, peerAssigned?: any, order?: any, month?: any, year?: any, date?: any) {
        this.page = page ? (isNaN(parseInt(String(page))) ? 1 : parseInt(String(page))) : 1;
        this.limit = limit ? (isNaN(parseInt(String(limit))) ? 10 : parseInt(String(limit))) : 10;
        this.peerAssigned = peerAssigned ? peerAssigned : "";
        this.order = order == "asc" ? order : "desc";
        this.month = !isNaN(parseInt(month))
            ? parseInt(month) <= 12 && parseInt(month) > 0
                ? parseInt(month)
                : null
            : null;
        this.year = !isNaN(parseInt(year)) ? parseInt(year) : null;
        this.date = !isNaN(parseInt(date))
            ? parseInt(date) <= 31 && parseInt(date) > 0
                ? parseInt(date)
                : null
            : null;
    }
}
