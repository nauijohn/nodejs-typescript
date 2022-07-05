import { v4 as uuidv4 } from "uuid";

export class SaveNotificationsByBatchRequestDto {
    public client_id: string;
    public data: any;
    public lookup_key: string = "NOTIF";
    public id: string = uuidv4();
    public reference_key: string;
    public created_by: string;
    public created_at: string;
    public updated_at: string;
    public read: boolean = false;
    public batch_id: string;
    constructor(client_id: string, data: any, batch_id: string, created_by: string, created_at: string, updated_at: string) {
        this.client_id = client_id;
        this.data = data ? data : null;
        this.batch_id = batch_id;
        this.reference_key = `NOTIF:${this.id}`;
        this.created_by = created_by;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
