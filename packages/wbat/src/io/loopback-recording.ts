import { WaveFile } from 'wavefile';

import type { LoopbackMetaData } from '../types';

type AudioDataLike = {
  channels: Float32Array[];
  fs: number;
};

export class LoopbackRecording {
  audioData: AudioDataLike;
  metaData: LoopbackMetaData;

  constructor(audioData: AudioDataLike, metaData: LoopbackMetaData) {
    this.audioData = audioData;
    this.metaData = metaData;
  }

  getWAV(): WaveFile {
    const wav = new WaveFile();
    wav.fromScratch(
      this.audioData.channels.length,
      this.audioData.fs,
      '32f',
      this.audioData.channels,
    );
    wav.setTag('IART', this.metaData.userAgent);
    wav.setTag('ICMT', this.metaData.id);

    return wav;
  }

  async postWAV(endpoint: string) {
    const wav = this.getWAV();
    const wavBuffer = wav.toBuffer();
    const wavArrayBuffer = new Uint8Array(wavBuffer).buffer;
    const blob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('loopbackRecording', blob, `${this.metaData.id}.wav`);
    formData.append('id', this.metaData.id);
    formData.append('userAgent', this.metaData.userAgent);
    formData.append('signal', this.metaData.signal);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    return response;
  }
}
