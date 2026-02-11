export declare class AudioTiming {
    private audioContext;
    private _pStartTime;
    private _startTime;
    constructor(audioContext: AudioContext);
    get startTime(): number;
    getTimestamp(): AudioTimestamp;
    getLag(): Promise<number>;
    scheduleAnimationFrame(time: number): Promise<void>;
    convertTime(time: number): number;
    /**
     * Checks the ratio of contextTime to currentTime and validates against a threshold.
     * Incorporates fixes for known browser-specific issues with Web Audio API.
     *
     * Experimental: Safari behaviour may have changed since the original bug was
     * observed. Keep this out of the stable API surface until a browser test
     * matrix confirms current behaviour.
     *
     * @param threshold A numeric threshold that the ratio should not exceed.
     * @returns boolean True if the ratio is below the threshold; otherwise, throws an error.
     */
    checkTimestampRatio(threshold?: number): boolean;
    setStartTime(delay?: number): number;
}
//# sourceMappingURL=audio-timing.d.ts.map