import type { AudioDataLike, SpectrogramData } from '../types';
import { SpectralSlice } from './spectral-slice';

const hanningWindow = (size: number): Float32Array => {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return window;
};

const maxAmp = (arrays: Float32Array[]): number => {
  return arrays.reduce((max, currentArray) => {
    const currentMax = Math.max(...currentArray);
    return Math.max(max, currentMax);
  }, -Infinity);
};

export const computeSpectrogram = (
  audioData: AudioDataLike,
  fftSize: number = 2048,
  hopSize: number = 1024,
): SpectrogramData => {
  if (!audioData.channels.length) {
    throw new Error('AudioData must include at least one channel.');
  }

  const pcmBuffer = audioData.channels[0];
  const numFrames = Math.floor((pcmBuffer.length - fftSize) / hopSize) + 1;
  if (numFrames <= 0) {
    throw new Error(
      `Input signal is shorter than fft_size (${fftSize}) and cannot form a frame.`,
    );
  }

  const specs = new Array<Float32Array>(numFrames);
  const window = hanningWindow(fftSize);

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = new Float32Array(fftSize);

    for (let j = 0; j < fftSize; j++) {
      frame[j] = pcmBuffer[start + j] * window[j];
    }

    const slice = new SpectralSlice(frame, audioData.fs, [0, audioData.fs / 2]);
    specs[i] = slice.spec;
  }

  return {
    specs,
    fft_size: fftSize,
    hop_size: hopSize,
    fs: audioData.fs,
    max_amp: maxAmp(specs),
  };
};
