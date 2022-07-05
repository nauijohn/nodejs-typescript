export class TicketsAssignedPerRiderResponseDto {
    public peerAssigned: string | null;
    public dispatchDate: string | null;
    public completed: number;
    public cancelled: number;
    public delayed: number;
    constructor(
        peerAssigned?: string,
        dispatchDate?: string,
        completed?: number,
        cancelled?: number,
        delayed?: number
    ) {
        this.peerAssigned = peerAssigned ? peerAssigned : null;
        this.dispatchDate = dispatchDate ? dispatchDate : null;
        this.completed = completed ? completed : 0;
        this.cancelled = cancelled ? cancelled : 0;
        this.delayed = delayed ? delayed : 0;
    }
}
