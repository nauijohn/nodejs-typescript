import { NumberList } from "aws-sdk/clients/iot";
import { v4 as uuidv4 } from "uuid";

export class GetNotificationsRequestDto {
    public id: string | null;
    public client_id: string | null;
    public createdDate: string | null;
    public toDate: string | null;
    public page: number;
    public limit: number;
    public read: string | null;
    public order: any;
    public isBatch: boolean;
    public batch_id: string | null;

    constructor(
        id?: any,
        client_id?: any,
        createdDate?: any,
        toDate?: any,
        page?: any,
        limit?: any,
        read?: any,
        order?: any,
        isBatch?: any,
        batch_id?: any
    ) {
        this.id = id ? String(id) : null;
        this.client_id = client_id ? String(client_id) : null;
        this.createdDate = createdDate ? String(createdDate) : null;
        this.toDate = toDate ? String(toDate) : null;
        this.page = page ? (isNaN(parseInt(String(page))) ? 1 : parseInt(String(page))) : 1;
        this.limit = limit ? (isNaN(parseInt(String(limit))) ? 10 : parseInt(String(limit))) : 10;
        this.read = read ? read : null;
        this.order = order ? order : "desc";
        this.isBatch = String(isBatch).toLowerCase() === "true" ? true : false;
        this.batch_id = batch_id ? String(batch_id) : null;
    }
}
