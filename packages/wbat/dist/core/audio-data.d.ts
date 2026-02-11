export declare class AudioData {
    channels: Float32Array[];
    fs: number;
    constructor(channels: Float32Array[], fs: number);
    multiply(): Float32Array;
    toAudioBuffer(context: AudioContext): AudioBuffer;
}
//# sourceMappingURL=audio-data.d.ts.map