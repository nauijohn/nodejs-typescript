export class ToggleOrSoftDeleteResponseDto {
    public message: string | null;
    public updatedItems: any;
    constructor(message?: string, updatedItems?: any) {
        this.message = message ? message : null;
        this.updatedItems = updatedItems ? updatedItems : null;
    }
}
