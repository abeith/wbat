import type { SearchRangeHz } from '../types';
export declare class SpectralSlice {
    private _peakBin;
    private _peakF;
    private _spec;
    private _signal;
    private _fs;
    private _fftSize;
    private _searchRangeHz;
    constructor(signal: Float32Array, fs: number, searchRangeHz: SearchRangeHz);
    get signal(): Float32Array;
    set signal(value: Float32Array);
    get fs(): number;
    set fs(value: number);
    get fftSize(): number;
    set fftSize(value: number);
    get spec(): Float32Array;
    get peakBin(): number;
    get peakF(): number;
    calculateBinOffset(bins: Float32Array): number;
}
//# sourceMappingURL=spectral-slice.d.ts.map