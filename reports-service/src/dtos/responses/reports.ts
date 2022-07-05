import { Pagination } from "../../models/pagination";

export class ReportsResponseDto {
    public next: Pagination | null;
    public previous: Pagination | null;
    public results: any;

    constructor(next?: Pagination | null, previous?: Pagination | null, results?: any) {
        this.next = next ? next : null;
        this.previous = previous ? previous : null;
        this.results = results ? results : [];
    }
}
