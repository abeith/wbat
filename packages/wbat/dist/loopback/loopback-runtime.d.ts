import { AudioData } from '../core';
import type { AudioTiming } from '../timing';
import type { LoopbackTimingOptions, RecordSessionController } from '../types';
type SaveWAV = (id: string, pcmBuffer: AudioBuffer) => Promise<void>;
export interface LoopbackRuntimeOptions {
    recorderWorkletUrl?: string;
}
export declare class LoopbackRuntime {
    private audioContext;
    private timing;
    private fs;
    private generateUniqueId;
    private saveWAV;
    private recorderWorkletName;
    private recorderWorkletUrl;
    private loadedRecorderWorkletUrl;
    private stream;
    private pcmBuffer;
    constructor(audioContext: AudioContext, timing: AudioTiming, fs: number, generateUniqueId: () => string, saveWAV: SaveWAV, options?: LoopbackRuntimeOptions);
    getPCMBuffer(): AudioBuffer | null;
    getRecorderWorkletUrl(): string;
    setRecorderWorkletUrl(url: string): void;
    loadAudioBuffer(filePath: string): Promise<AudioBuffer>;
    prepareAudioBuffer(source: string | AudioBuffer | AudioData): Promise<AudioBuffer>;
    play(source: string | AudioBuffer | AudioData, delay?: number): Promise<void>;
    requestMicrophoneAccess(): Promise<void>;
    prepareMicStream(): Promise<void>;
    record(delay?: number, duration?: number): Promise<RecordSessionController>;
    createBufferFromPCM(pcmData: Array<number> | Float32Array, sampleRate?: number): AudioBuffer;
    mergeChunks(chunks: Float32Array[]): Float32Array;
    prepareAudioSource(source: AudioData): Promise<AudioBuffer>;
    virtualLoopback(source: string | AudioBuffer, options: LoopbackTimingOptions): Promise<AudioData>;
    private ensureRecorderWorkletLoaded;
    private ensureAudioContextRunning;
    private resolveLoopbackWindow;
}
export {};
//# sourceMappingURL=loopback-runtime.d.ts.map