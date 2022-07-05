export class GetNotificationsResponseModel {
    public notif_id: string | null;
    public id: string | null;
    public client_id: string | null;
    public data: any | null;
    public created_by: string | null;
    public created_at: string;
    public read: boolean | null;
    public batch_id: string | null;

    constructor(
        id: string | null,
        client_id: string | null,
        data: any | null,
        created_by: string | null,
        created_at: string,
        read: boolean | null,
        batch_id: string
    ) {
        this.notif_id = id ? `NOTIF:${id}` : null;
        this.id = id ? id : null;
        this.client_id = client_id ? client_id : null;
        this.data = data ? data : null;
        this.created_by = created_by ? created_by : null;
        this.created_at = created_at;
        this.read = read;
        this.batch_id = batch_id ? batch_id : null;
    }
}
