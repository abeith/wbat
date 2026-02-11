import { mode } from 'd3-array';

import type { PitchTrackObject, SearchRangeHz } from '../types';
import { SpectralSlice } from './spectral-slice';

type AudioDataLike = {
  channels: Float32Array[];
  fs: number;
};

export class PitchTrack {
  audioData: AudioDataLike;
  fftSize: number;
  hopSize: number;
  searchRangeHz: SearchRangeHz;
  private bufferLength: number;
  private _result: PitchTrackObject | null = null;

  constructor(
    audioData: AudioDataLike,
    fftSize: number = 2048,
    hopSize: number = 1024,
    searchRangeHz?: SearchRangeHz,
  ) {
    this.audioData = audioData;
    this.fftSize = fftSize;
    this.hopSize = hopSize;
    const binWidth = this.audioData.fs / this.fftSize;
    // Defaults ignore DC offset bin and Nyquist edge bin
    this.searchRangeHz = searchRangeHz || [
      binWidth,
      this.audioData.fs / 2 - binWidth,
    ];
    this.bufferLength = audioData.channels[0].length;
  }

  peakF(values: number[]) {
    return mode(values.map((x: number): number => Math.round(x)));
  }

  maxAmp(arrays: Float32Array[]): number {
    return arrays.reduce((max, currentArray) => {
      const currentMax = Math.max(...currentArray);
      return Math.max(max, currentMax);
    }, -Infinity);
  }

  median(values: number[]) {
    if (values.length === 0) {
      throw new Error('Input array is empty');
    }

    this.peakF(values);

    // Sorting values, preventing original array
    // from being mutated.
    values = [...values].sort((a, b) => a - b);

    const half = Math.floor(values.length / 2);

    return values.length % 2
      ? values[half]
      : (values[half - 1] + values[half]) / 2;
  }

  get result() {
    if (this._result === null) {
      const numFrames =
        Math.floor((this.bufferLength - this.fftSize) / this.hopSize) + 1;
      const t = new Array<number>(numFrames);
      const f = new Array<number>(numFrames);
      const stft = new Array<Float32Array>(numFrames);
      const window = this.hanningWindow();
      const pcmBuffer = this.audioData.channels[0];

      for (let i = 0; i < numFrames; i++) {
        const start = i * this.hopSize;
        const frame = new Float32Array(this.fftSize);

        // Apply window to frame
        for (let j = 0; j < this.fftSize; j++) {
          frame[j] = pcmBuffer[start + j] * window[j];
        }

        const specSlice = new SpectralSlice(
          frame,
          this.audioData.fs,
          this.searchRangeHz,
        );
        stft[i] = specSlice.spec;
        f[i] = specSlice.peakF;
        t[i] = ((i + 0.5) * this.hopSize) / this.audioData.fs;
      }

      const median_f = this.median(f);

      this._result = {
        t: t,
        f: f,
        median: median_f,
        mode: this.peakF(f),
        max_amp: this.maxAmp(stft),
        specs: stft,
        fft_size: this.fftSize,
        hop_size: this.hopSize,
      };
    }

    return this._result;
  }

  hanningWindow(): Float32Array {
    const window = new Float32Array(this.fftSize);
    for (let i = 0; i < this.fftSize; i++) {
      window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (this.fftSize - 1));
    }
    return window;
  }
}
