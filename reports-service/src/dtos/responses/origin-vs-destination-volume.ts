export class OriginVsDestinationVolumeResponseDto {
    public dispatchDate: string;
    public originMaps: any | null;
    public destinationMaps: any | null;
    constructor(dispatchDate?: string, originMaps?: any, destinationMaps?: any) {
        this.dispatchDate = dispatchDate ? dispatchDate : "";
        this.originMaps = originMaps;
        this.destinationMaps = destinationMaps;
    }
}
