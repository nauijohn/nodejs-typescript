export class SaveNotificationsByBatchResponseDto {
    public message: string;
    public results: any;
    constructor(data?: any, message?: any) {
        this.message = message ? message : null;
        this.results = data ? data : null;
    }
}
