import type { StimSource } from '../types';

type AudioDataLike = {
  channels: Float32Array[];
  fs: number;
};

const ensureArrayBufferView = (
  data: Float32Array,
): Float32Array<ArrayBuffer> =>
  data.buffer instanceof ArrayBuffer
    ? (data as Float32Array<ArrayBuffer>)
    : (new Float32Array(data) as Float32Array<ArrayBuffer>);

export class AudioDataSource implements StimSource {
  private _audioBuffer: AudioBuffer | null = null;
  private audioData: AudioDataLike;
  private audioContext: AudioContext;

  constructor(context: AudioContext, source: AudioDataLike) {
    this.audioContext = context;
    this.audioData = source;
  }

  getAudioBuffer(): AudioBuffer {
    if (this._audioBuffer === null) {
      this._audioBuffer = this.audioContext.createBuffer(
        this.audioData.channels.length,
        this.audioData.channels[0].length,
        this.audioData.fs,
      );
      this.audioData.channels.forEach((channelData, index) => {
        this._audioBuffer!.copyToChannel(
          ensureArrayBufferView(channelData),
          index,
        );
      });
    }

    return this._audioBuffer;
  }
}
