import { v4 as uuidv4 } from "uuid";

export class SaveNotificationsRequestDto {
    public client_id: string | null;
    public data: any | null;
    public lookup_key: string = "NOTIF";
    public id: string = uuidv4();
    public reference_key: string = `NOTIF:${this.id}`;
    public created_by: string;
    public created_at: string;
    public updated_at: string;
    public read: boolean = false;
    constructor(client_id: string, data: any, created_by: string, created_at: string, updated_at: string) {
        this.client_id = client_id;
        this.data = data;
        this.created_by = created_by;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
