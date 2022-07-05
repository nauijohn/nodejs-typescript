export class Payload {
    public statusCode: number;
    public data: any;
    constructor(statusCode: number, data: any) {
        this.statusCode = statusCode;
        this.data = data;
    }
}
