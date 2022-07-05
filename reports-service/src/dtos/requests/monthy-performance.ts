export class MonthPerformanceRequestDto {
    public month: number | null;
    public year: number | null;
    public toMonth: number | null;
    public toYear: number | null;
    public order: any;
    constructor(month?: any, year?: any, toMonth?: any, toYear?: any, order?: any) {
        this.month = !isNaN(parseInt(month))
            ? parseInt(month) <= 12 && parseInt(month) > 0
                ? parseInt(month)
                : null
            : null;
        this.year = !isNaN(parseInt(year)) ? parseInt(year) : null;
        this.toMonth =
            !isNaN(parseInt(toMonth)) && !isNaN(parseInt(month)) && parseInt(toMonth) >= parseInt(month)
                ? parseInt(toMonth) <= 12 && parseInt(toMonth) > 0
                    ? parseInt(toMonth)
                    : null
                : null;
        this.toYear = !isNaN(parseInt(year)) && !isNaN(parseInt(toYear)) ? parseInt(toYear) : null;
        this.order = order == "desc" ? order : "asc";
    }
}
