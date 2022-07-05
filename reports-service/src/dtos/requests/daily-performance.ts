export class DailyPerformanceRequestDto {
    public month: number | null;
    public date: number | null;
    public year: number | null;
    public toMonth: number | null;
    public toDate: number | null;
    public toYear: number | null;
    public category: string;
    public order: any;
    constructor(
        month?: any,
        date?: any,
        year?: any,
        toMonth?: any,
        toDate?: any,
        toYear?: any,
        category?: any,
        order?: any
    ) {
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
        this.toMonth =
            !isNaN(parseInt(toMonth)) && !isNaN(parseInt(month)) && parseInt(toMonth) >= parseInt(month)
                ? parseInt(toMonth) <= 12 && parseInt(toMonth) > 0
                    ? parseInt(toMonth)
                    : null
                : null;
        this.toDate =
            !isNaN(parseInt(toDate)) && !isNaN(parseInt(date)) && parseInt(toDate) >= parseInt(date)
                ? parseInt(toDate) <= 31 && parseInt(toDate) > 0
                    ? parseInt(toDate)
                    : null
                : null;
        this.toYear = !isNaN(parseInt(year)) && !isNaN(parseInt(toYear)) ? parseInt(toYear) : null;
        this.category = category ? category.toLowerCase() : "";
        this.order = order == "desc" ? order : "asc";
    }
}
