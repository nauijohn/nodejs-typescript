export class ToggleOrSoftDeleteRequestDto {
    public id: string[] | string | null;
    public isBatch: boolean;
    public batch_id: string | null;
    constructor(id?: any, isBatch?: any, batch_id?: any) {
        this.id = id ? id : null;
        this.isBatch = String(isBatch).toLowerCase() == "true" ? true : String(isBatch).toLowerCase() == "false" ? false : false;
        this.batch_id = batch_id ? batch_id : null;
    }
}
