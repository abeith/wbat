// AuditoryToolbox.ts

// Import the entire package
import audioBufferToWav from 'audiobuffer-to-wav';
import { WaveFile } from 'wavefile';
import { computeSpectrogram, PitchTrack } from './analysis';
import { AudioData } from './core';
import { LoopbackRecording } from './io';
import { LoopbackRuntime } from './loopback';
import { plotPitchTrackValidation, plotSpectrogram } from './rendering';
import { AudioTiming } from './timing';
import type {
  AudioDataLike,
  AuditoryToolboxOptions,
  LoopbackTimingOptions,
  LoopbackMetaData,
  PitchTrackObject,
  RecordSessionController,
  SearchRangeHz,
  SpectrogramData,
  SpectrogramPlotConfig,
} from './types';
export type {
  AudioDataLike,
  AuditoryToolboxOptions,
  LoopbackTimingInfo,
  LoopbackTimingOptions,
  LoopbackMetaData,
  PitchTrackObject,
  RecordSessionController,
  SearchRangeHz,
  SpectrogramData,
  SpectrogramOverlay,
  SpectrogramPlotConfig,
  StimSource,
} from './types';
export { AudioData } from './core';

export class AuditoryToolbox {
  private audioContext: AudioContext;
  private fs: number;
  private timing: AudioTiming;
  private loopback: LoopbackRuntime;
  private wavBlobs: Map<string, Blob>;

  constructor(
    audioContext?: AudioContext,
    options: AuditoryToolboxOptions = {},
  ) {
    this.audioContext = audioContext || new AudioContext();
    this.fs = this.audioContext.sampleRate;
    this.timing = new AudioTiming(this.audioContext);
    this.wavBlobs = new Map();
    this.loopback = new LoopbackRuntime(
      this.audioContext,
      this.timing,
      this.fs,
      () => this.generateUniqueId(),
      (id, pcmBuffer) => this.saveWAV(id, pcmBuffer),
      { recorderWorkletUrl: options.recorderWorkletUrl },
    );
  }

  getRecorderWorkletUrl(): string {
    return this.loopback.getRecorderWorkletUrl();
  }

  setRecorderWorkletUrl(url: string): void {
    this.loopback.setRecorderWorkletUrl(url);
  }

  public plotSpectrogram(
    pitchTrackData: PitchTrackObject,
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
  ): void;
  public plotSpectrogram(config: SpectrogramPlotConfig): void;
  public plotSpectrogram(
    pitchTrackOrConfig: PitchTrackObject | SpectrogramPlotConfig,
    canvas?: HTMLCanvasElement,
    width?: number,
    height?: number,
  ): void {
    if (
      typeof HTMLCanvasElement !== 'undefined' &&
      canvas instanceof HTMLCanvasElement &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return this.plotPitchTrackValidation(
        pitchTrackOrConfig as PitchTrackObject,
        canvas,
        width,
        height,
      );
    }

    const config = pitchTrackOrConfig as SpectrogramPlotConfig;
    const spectrogram =
      config.spectrogram ||
      (config.audioData
        ? this.createSpectrogramData(
            config.audioData,
            config.fft_size,
            config.hop_size,
          )
        : null);
    if (!spectrogram) {
      throw new Error('plotSpectrogram requires spectrogram data or audioData.');
    }

    return plotSpectrogram({
      ...config,
      spectrogram,
    });
  }

  public plotPitchTrackValidation(
    pitchTrackData: PitchTrackObject,
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
  ): void {
    return plotPitchTrackValidation(pitchTrackData, canvas, width, height, this.fs);
  }

  public createSpectrogramData(
    audioData: AudioDataLike,
    fft_size: number = 2048,
    hop_size: number = 1024,
  ): SpectrogramData {
    return computeSpectrogram(audioData, fft_size, hop_size);
  }

  calculateMagnitudes(fftData: Float32Array): Float32Array {
    const magnitudes = new Float32Array(fftData.length / 2);
    for (let i = 0; i < fftData.length; i += 2) {
      const real = fftData[i];
      const imag = fftData[i + 1];
      magnitudes[i / 2] = Math.sqrt(real * real + imag * imag);
    }
    return magnitudes;
  }

  // For quadratic interpolation of frequency from peak and adjacent bins
  calculateBinOffset(bins: Float32Array): number {
    const a = bins[0];
    const b = bins[1];
    const c = bins[2];

    const p = (a - c) / (2 * (a - 2 * b + c));
    return p;
  }

  applyHanningWindow(buffer: Float32Array): Float32Array {
    const windowedBuffer = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      windowedBuffer[i] =
        buffer[i] *
        (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (buffer.length - 1)));
    }
    return windowedBuffer;
  }

  hann(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return window;
  }

  downloadBlob(id: string) {
    const blob = this.wavBlobs.get(id);
    const url = URL.createObjectURL(blob!);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}.wav`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async loadAudioBuffer(filePath: string): Promise<AudioBuffer> {
    return this.loopback.loadAudioBuffer(filePath);
  }

  async saveWAV(id: string, pcmBuffer: AudioBuffer): Promise<void> {
    const wav = audioBufferToWav(pcmBuffer);
    const blob = new window.Blob([new DataView(wav)], { type: 'audio/x-wav' });
    this.wavBlobs.set(id, blob);
  }

  async saveWAV2(
    id: string,
    pcmL: Float32Array,
    pcmR: Float32Array,
  ): Promise<boolean> {
    // const pcmLMerged = this.mergeChunks(pcmL);
    // const pcmRMerged = this.mergeChunks(pcmR);

    // stereo, 32-bit float
    const wav = new WaveFile();
    wav.fromScratch(2, this.fs, '32f', [pcmL, pcmR]);

    // Use the artist tag to store the user agent string
    wav.setTag('IART', navigator.userAgent);
    // Use comment tag for other metadata
    const commitHash = process.env.COMMIT_HASH || 'unknown';
    wav.setTag('ICMT', `commit: ${commitHash}`);

    const url = wav.toDataURI();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}.wav`;
    link.click();
    URL.revokeObjectURL(url);

    return true;
  }

  async playPCM(): Promise<void> {
    const pcmBuffer = this.loopback.getPCMBuffer();
    if (pcmBuffer) {
      this.play(pcmBuffer);
    } else {
      console.log('No PCM data');
    }
    console.log(pcmBuffer);
  }

  async prepareAudioBuffer(
    source: string | AudioBuffer | AudioData,
  ): Promise<AudioBuffer> {
    return this.loopback.prepareAudioBuffer(source);
  }

  /**
   * @requiresUserGesture
   * @manualTestRequired
   */
  async play(
    source: string | AudioBuffer | AudioData,
    delay: number = 0,
  ): Promise<void> {
    return this.loopback.play(source, delay);
  }

  /**
   * @requiresMicrophone
   * @requiresUserGesture
   * @manualTestRequired
   */
  async requestMicrophoneAccess(): Promise<void> {
    return this.loopback.requestMicrophoneAccess();
  }

  generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * @requiresMicrophone
   * @requiresUserGesture
   * @manualTestRequired
   */
  async prepareMicStream(): Promise<void> {
    return this.loopback.prepareMicStream();
  }

  // Returns a session controller and stores the final recording in wavBlobs.
  /**
   * @requiresMicrophone
   * @requiresUserGesture
   * @manualTestRequired
   */
  async record(
    delay: number = 0,
    duration: number = 1,
  ): Promise<RecordSessionController> {
    return this.loopback.record(delay, duration);
  }

  // Need to adapt this to work with stereo AudioBuffers
  createBufferFromPCM(
    pcmData: Array<number> | Float32Array,
    sampleRate: number = this.fs,
  ): AudioBuffer {
    return this.loopback.createBufferFromPCM(pcmData, sampleRate);
  }

  /**
   * Experimental: timestamp helpers are browser-specific and may change.
   */
  getTimestamp(): AudioTimestamp {
    return this.timing.getTimestamp();
  }

  /**
   * Experimental: timestamp helpers are browser-specific and may change.
   */
  async getLag(): Promise<number> {
    return this.timing.getLag();
  }

  // Convert time relative to startTime to performance time
  /**
   * Experimental: timestamp helpers are browser-specific and may change.
   */
  convertTime(time: number): number {
    return this.timing.convertTime(time);
  }

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
  checkTimestampRatio(threshold: number = 10): boolean {
    return this.timing.checkTimestampRatio(threshold);
  }

  /**
   * Experimental: timestamp helpers are browser-specific and may change.
   */
  setStartTime(delay: number = 0): number {
    return this.timing.setStartTime(delay);
  }

  /**
   * Experimental: convenience helper used in internal demos.
   * @requiresUserGesture
   * @manualTestRequired
   */
  async playChirp(max_f: number = 16000, delay: number = 0): Promise<void> {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.connect(this.audioContext.destination);
    this.setStartTime(delay);
    const endTime = this.timing.startTime + 2;
    oscillator.frequency.setValueAtTime(0, this.timing.startTime);
    oscillator.frequency.linearRampToValueAtTime(max_f, endTime);
    oscillator.start(this.timing.startTime);
    oscillator.stop(endTime);
  }

  /**
   * Experimental: convenience helper used in internal demos.
   */
  async createSineBuffer(
    min_f: number = 220,
    max_f: number = 440,
    dur: number = 2,
  ): Promise<AudioBuffer> {
    const len = Math.round(dur * this.fs);
    const f_diff = max_f - min_f;

    const x_aud = Array.from({ length: len }, (_, i) => i / this.fs);

    // Phase increments of sinewave frequency modulation
    const phaseIncrements = x_aud
      .map((x) => (Math.sin(2 * Math.PI * x) + 1) / 2)
      .map((y) => min_f + f_diff * y)
      .map((f) => (2 * Math.PI * f) / this.fs);

    // Cumulative phase calculation
    const phases = phaseIncrements.reduce((acc, val) => {
      if (acc.length > 0) acc.push(acc[acc.length - 1] + val);
      else acc.push(val);
      return acc;
    }, [] as number[]);

    // Generate the audio signal
    const signal = phases.map((phase) => Math.sin(phase));

    const buffer = this.createBufferFromPCM(signal, this.fs);

    return buffer;
  }

  /**
   * Experimental: convenience helper used in internal demos.
   * @requiresUserGesture
   * @manualTestRequired
   */
  async playSine(
    min_f: number = 220,
    max_f: number = 440,
    dur: number = 2,
  ): Promise<void> {
    const buffer = await this.createSineBuffer(min_f, max_f, dur);
    this.play(buffer);
  }

  async getOutputLatency(): Promise<number> {
    return await this.audioContext.outputLatency;
  }

  mergeChunks(chunks: Float32Array[]): Float32Array {
    return this.loopback.mergeChunks(chunks);
  }

  async prepareAudioSource(source: AudioData): Promise<AudioBuffer> {
    return this.loopback.prepareAudioSource(source);
  }

  async saveLoopback(
    audioData: AudioData,
    metaData: LoopbackMetaData,
    endpoint: string = '/save/loopback',
  ): Promise<void> {
    if (!metaData.id) throw new Error('No file ID provided');
    if (!metaData.signal) throw new Error('No signal reference provided');
    if (!metaData.userAgent) throw new Error('No userAgent provided');

    const loopbackRecording = new LoopbackRecording(audioData, metaData);

    try {
      const response = await loopbackRecording.postWAV(endpoint);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  /**
   * Record both stimulus and response as stereo channels of an AudioBuffer.
   * @requiresMicrophone
   * @requiresUserGesture
   * @manualTestRequired
   */
  async virtualLoopback(
    source: string | AudioBuffer,
    options: LoopbackTimingOptions,
  ): Promise<AudioData> {
    return this.loopback.virtualLoopback(source, options);
  }

  // Frequency modulated continuous wave radar technique
  async fmcw(
    audioData: AudioData | string,
    searchRangeHz?: SearchRangeHz,
  ): Promise<PitchTrackObject> {
    if (typeof audioData === 'string') {
      const buffer = await this.prepareAudioBuffer(audioData);
      if (buffer.numberOfChannels < 2) {
        throw new Error(
          'fmcw() requires a stereo signal. Use virtualLoopback() or provide a 2-channel AudioData.',
        );
      }
      const pcmL = new Float32Array(buffer.length);
      const pcmR = new Float32Array(buffer.length);
      buffer.copyFromChannel(pcmL, 0);
      buffer.copyFromChannel(pcmR, 1);
      audioData = new AudioData([pcmL, pcmR], this.fs);
    }
    if (audioData.channels.length < 2) {
      throw new Error(
        'fmcw() requires a stereo signal. Use virtualLoopback() or provide a 2-channel AudioData.',
      );
    }

    const mix = new AudioData([audioData.multiply()], this.fs);
    const pitchTrack = new PitchTrack(mix, 2048, 1024, searchRangeHz);
    return pitchTrack.result;
  }

  // Using the AudioBuffer returned by virtualLoopback, perform latency test
  async latencyTest(
    source: string | AudioBuffer,
    searchRangeHz?: SearchRangeHz,
  ): Promise<PitchTrackObject> {
    const buffer =
      typeof source === 'string'
        ? await this.prepareAudioBuffer(source)
        : source;
    const duration = buffer.duration;
    const audioData = await this.virtualLoopback(buffer, {
      delay: 0.1,
      duration,
    });
    return this.fmcw(audioData, searchRangeHz);
  }

  async detectPitch(
    source: string | AudioBuffer,
    searchRangeHz?: SearchRangeHz,
  ): Promise<PitchTrackObject> {
    const buffer = await this.prepareAudioBuffer(source);
    const pcmBuffer = new Float32Array(buffer.length);
    buffer.copyFromChannel(pcmBuffer, 0);

    const audioData = new AudioData([pcmBuffer], this.fs);

    const pitchTrack = new PitchTrack(audioData, 2048, 1024, searchRangeHz);

    return pitchTrack.result;
  }
}
