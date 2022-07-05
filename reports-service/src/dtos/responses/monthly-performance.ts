export class MonthPerformanceResponseDto {
    public dispatchDate: string | null;
    public totalCount: number | null;
    public completed: number | null;
    public compRate: string | null;
    constructor(dispatchDate?: string, totalCount?: number, completed?: number) {
        this.dispatchDate = dispatchDate ? dispatchDate : null;
        this.totalCount = totalCount ? totalCount : 0;
        this.completed = completed ? completed : 0;
        this.compRate = completed && totalCount ? `${((completed / totalCount) * 100).toFixed(2)} %` : "0.00 %";
    }
}
