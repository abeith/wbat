import { WaveFile } from 'wavefile';
import type { LoopbackMetaData } from '../types';
type AudioDataLike = {
    channels: Float32Array[];
    fs: number;
};
export declare class LoopbackRecording {
    audioData: AudioDataLike;
    metaData: LoopbackMetaData;
    constructor(audioData: AudioDataLike, metaData: LoopbackMetaData);
    getWAV(): WaveFile;
    postWAV(endpoint: string): Promise<Response>;
}
export {};
//# sourceMappingURL=loopback-recording.d.ts.map