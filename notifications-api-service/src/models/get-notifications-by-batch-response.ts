export class GetNotificationsByBatchResponseModel {
    public batch_id: string | null;
    public notif: any | null;

    constructor(batch_id: string | null, notif: string | null) {
        this.batch_id = batch_id;
        this.notif = notif;
    }
}
