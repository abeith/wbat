import type { StimSource } from '../types';
type AudioDataLike = {
    channels: Float32Array[];
    fs: number;
};
export declare class AudioDataSource implements StimSource {
    private _audioBuffer;
    private audioData;
    private audioContext;
    constructor(context: AudioContext, source: AudioDataLike);
    getAudioBuffer(): AudioBuffer;
}
export {};
//# sourceMappingURL=audio-data-source.d.ts.map