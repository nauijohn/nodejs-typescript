export class DailyPerformanceResponseDto {
    public dispatchDate: string | null;
    public totalCount: number | null;
    public completed: number | null;
    public compRate: string | null;
    constructor(dispatchDate?: string, totalCount?: number, completed?: number) {
        this.dispatchDate = dispatchDate ? dispatchDate : null;
        this.totalCount = totalCount ? totalCount : null;
        this.completed = completed ? completed : null;
        this.compRate = completed && totalCount ? ((completed / totalCount) * 100).toFixed(2) : null;
    }
}
