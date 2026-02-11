import type { PitchTrackObject, SearchRangeHz } from '../types';
type AudioDataLike = {
    channels: Float32Array[];
    fs: number;
};
export declare class PitchTrack {
    audioData: AudioDataLike;
    fftSize: number;
    hopSize: number;
    searchRangeHz: SearchRangeHz;
    private bufferLength;
    private _result;
    constructor(audioData: AudioDataLike, fftSize?: number, hopSize?: number, searchRangeHz?: SearchRangeHz);
    peakF(values: number[]): number;
    maxAmp(arrays: Float32Array[]): number;
    median(values: number[]): number;
    get result(): PitchTrackObject;
    hanningWindow(): Float32Array;
}
export {};
//# sourceMappingURL=pitch-track.d.ts.map