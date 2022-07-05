export class OriginVsDestinationVolumeRequestDto {
    public month: number | null;
    public year: number | null;
    public date: number | null;
    constructor(month?: any, year?: any, date?: any) {
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
