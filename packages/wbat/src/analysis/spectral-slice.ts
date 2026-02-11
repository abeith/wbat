import FFT from 'fft.js';

import type { SearchRangeHz } from '../types';

export class SpectralSlice {
  private _peakBin: number | null = null;
  private _peakF: number | null = null;
  private _spec: Float32Array | null = null;
  private _signal: Float32Array;
  private _fs: number;
  private _fftSize: number;
  private _searchRangeHz: SearchRangeHz;

  constructor(signal: Float32Array, fs: number, searchRangeHz: SearchRangeHz) {
    this._signal = signal;
    this._fs = fs;
    this._fftSize = signal.length;
    this._searchRangeHz = searchRangeHz;
  }

  get signal() {
    return this._signal;
  }

  set signal(value: Float32Array) {
    this._signal = value;
    this._peakBin = null;
    this._peakF = null;
    this._spec = null;
  }

  get fs() {
    return this._fs;
  }

  set fs(value: number) {
    this._fs = value;
    this._peakBin = null;
    this._peakF = null;
    this._spec = null;
  }

  get fftSize() {
    return this._fftSize;
  }

  set fftSize(value: number) {
    this._fftSize = value;
    this._peakBin = null;
    this._peakF = null;
    this._spec = null;
  }

  get spec(): Float32Array {
    if (this._spec === null) {
      const fft = new FFT(this._fftSize);
      const out = fft.createComplexArray();
      fft.realTransform(out, this._signal);
      const fftData = new Float32Array(out);

      const magnitudes = new Float32Array(fftData.length / 2);
      for (let i = 0; i < fftData.length; i += 2) {
        const real = fftData[i];
        const imag = fftData[i + 1];
        magnitudes[i / 2] = Math.sqrt(real * real + imag * imag);
      }
      this._spec = magnitudes.map((x: number): number => Math.log10(x));
    }

    return this._spec;
  }

  get peakBin(): number {
    if (this._peakBin === null) {
      const interiorStart = 1;
      const interiorEnd = Math.max(interiorStart, this.spec.length - 2);
      const binWidth = this.fs / this.fftSize;
      const minHz = Math.max(0, this._searchRangeHz[0]);
      const maxHz = Math.min(this.fs / 2, this._searchRangeHz[1]);
      let startBin = Math.ceil(minHz / binWidth);
      let endBin = Math.floor(maxHz / binWidth);

      // Keep peak search away from spectrum edges and mirrored bins.
      startBin = Math.max(interiorStart, startBin);
      endBin = Math.min(interiorEnd, endBin);
      if (startBin > endBin) {
        startBin = interiorStart;
        endBin = interiorEnd;
      }

      let bestBin = startBin;
      let bestMag = this.spec[startBin];
      for (let i = startBin + 1; i <= endBin; i++) {
        if (this.spec[i] > bestMag) {
          bestMag = this.spec[i];
          bestBin = i;
        }
      }

      this._peakBin = bestBin;
    }
    return this._peakBin;
  }

  get peakF(): number {
    if (this._peakF === null) {
      // Skip interpolation at the spectrum edges; there are no adjacent bins.
      if (this.peakBin <= 0 || this.peakBin >= this.spec.length - 1) {
        this._peakF = (this.fs * this.peakBin) / this.fftSize;
      } else {
        const offset = this.calculateBinOffset(
          this.spec.slice(this.peakBin - 1, this.peakBin + 2),
        );
        const safeOffset = Number.isFinite(offset)
          ? Math.max(-0.5, Math.min(0.5, offset))
          : 0;
        this._peakF = (this.fs * (this.peakBin + safeOffset)) / this.fftSize;
      }
    }
    return this._peakF;
  }

  // Uses quadratic interpolation to estimate offset of peaks that fall between FFT bins
  calculateBinOffset(bins: Float32Array): number {
    if (bins.length < 3) {
      return 0;
    }

    const a = bins[0];
    const b = bins[1];
    const c = bins[2];

    const denominator = 2 * (a - 2 * b + c);
    // Guard against zero|Inf denominators
    if (!Number.isFinite(denominator) || denominator === 0) {
      return 0;
    }

    const subBinOffset = (a - c) / denominator;
    if (!Number.isFinite(subBinOffset)) {
      return 0;
    }
    return subBinOffset;
  }
}
