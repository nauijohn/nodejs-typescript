export class Pagination {
    public page?: number | null;
    public limit?: number | null;
    constructor(page?: number | null, limit?: number | null) {
        this.page = page;
        this.limit = limit;
    }
}
