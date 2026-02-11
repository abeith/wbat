import { AudioData } from './core';
import type { AudioDataLike, AuditoryToolboxOptions, LoopbackTimingOptions, LoopbackMetaData, PitchTrackObject, RecordSessionController, SearchRangeHz, SpectrogramData, SpectrogramPlotConfig } from './types';
export type { AudioDataLike, AuditoryToolboxOptions, LoopbackTimingInfo, LoopbackTimingOptions, LoopbackMetaData, PitchTrackObject, RecordSessionController, SearchRangeHz, SpectrogramData, SpectrogramOverlay, SpectrogramPlotConfig, StimSource, } from './types';
export { AudioData } from './core';
export declare class AuditoryToolbox {
    private audioContext;
    private fs;
    private timing;
    private loopback;
    private wavBlobs;
    constructor(audioContext?: AudioContext, options?: AuditoryToolboxOptions);
    getRecorderWorkletUrl(): string;
    setRecorderWorkletUrl(url: string): void;
    plotSpectrogram(pitchTrackData: PitchTrackObject, canvas: HTMLCanvasElement, width: number, height: number): void;
    plotSpectrogram(config: SpectrogramPlotConfig): void;
    plotPitchTrackValidation(pitchTrackData: PitchTrackObject, canvas: HTMLCanvasElement, width: number, height: number): void;
    createSpectrogramData(audioData: AudioDataLike, fft_size?: number, hop_size?: number): SpectrogramData;
    calculateMagnitudes(fftData: Float32Array): Float32Array;
    calculateBinOffset(bins: Float32Array): number;
    applyHanningWindow(buffer: Float32Array): Float32Array;
    hann(size: number): Float32Array;
    downloadBlob(id: string): void;
    loadAudioBuffer(filePath: string): Promise<AudioBuffer>;
    saveWAV(id: string, pcmBuffer: AudioBuffer): Promise<void>;
    saveWAV2(id: string, pcmL: Float32Array, pcmR: Float32Array): Promise<boolean>;
    playPCM(): Promise<void>;
    prepareAudioBuffer(source: string | AudioBuffer | AudioData): Promise<AudioBuffer>;
    /**
     * @requiresUserGesture
     * @manualTestRequired
     */
    play(source: string | AudioBuffer | AudioData, delay?: number): Promise<void>;
    /**
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    requestMicrophoneAccess(): Promise<void>;
    generateUniqueId(): string;
    /**
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    prepareMicStream(): Promise<void>;
    /**
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    record(delay?: number, duration?: number): Promise<RecordSessionController>;
    createBufferFromPCM(pcmData: Array<number> | Float32Array, sampleRate?: number): AudioBuffer;
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    getTimestamp(): AudioTimestamp;
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    getLag(): Promise<number>;
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    convertTime(time: number): number;
    /**
     * Checks the ratio of contextTime to currentTime and validates against a threshold.
     * Incorporates fixes for known browser-specific issues with Web Audio API.
     *
     * @param threshold A numeric threshold that the ratio should not exceed.
     * @returns boolean True if the ratio is below the threshold; otherwise, throws an error.
     */
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    checkTimestampRatio(threshold?: number): boolean;
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    setStartTime(delay?: number): number;
    /**
     * Experimental: convenience helper used in internal demos.
     * @requiresUserGesture
     * @manualTestRequired
     */
    playChirp(max_f?: number, delay?: number): Promise<void>;
    /**
     * Experimental: convenience helper used in internal demos.
     */
    createSineBuffer(min_f?: number, max_f?: number, dur?: number): Promise<AudioBuffer>;
    /**
     * Experimental: convenience helper used in internal demos.
     * @requiresUserGesture
     * @manualTestRequired
     */
    playSine(min_f?: number, max_f?: number, dur?: number): Promise<void>;
    getOutputLatency(): Promise<number>;
    mergeChunks(chunks: Float32Array[]): Float32Array;
    prepareAudioSource(source: AudioData): Promise<AudioBuffer>;
    saveLoopback(audioData: AudioData, metaData: LoopbackMetaData, endpoint?: string): Promise<void>;
    /**
     * Record both stimulus and response as stereo channels of an AudioBuffer.
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    virtualLoopback(source: string | AudioBuffer, options: LoopbackTimingOptions): Promise<AudioData>;
    fmcw(audioData: AudioData | string, searchRangeHz?: SearchRangeHz): Promise<PitchTrackObject>;
    latencyTest(source: string | AudioBuffer, searchRangeHz?: SearchRangeHz): Promise<PitchTrackObject>;
    detectPitch(source: string | AudioBuffer, searchRangeHz?: SearchRangeHz): Promise<PitchTrackObject>;
}
//# sourceMappingURL=index.d.ts.map