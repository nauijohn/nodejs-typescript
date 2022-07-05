import { Pagination } from "../../models/pagination";

export class GetNotificationsResponseDto {
    public next: Pagination | null;
    public previous: Pagination | null;
    public results: any;

    constructor(next?: Pagination, previous?: Pagination, results?: any) {
        this.next = next ? next : null;
        this.previous = previous ? previous : null;
        this.results = results ? results : [];
    }
}
