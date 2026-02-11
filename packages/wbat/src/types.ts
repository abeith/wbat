import type { AudioData } from './core/audio-data';

export interface StimSource {
  getAudioBuffer(): AudioBuffer;
}

export interface AudioDataLike {
  channels: Float32Array[];
  fs: number;
}

export interface PitchTrackObject {
  t: number[];
  f: number[];
  median: number;
  mode: number;
  max_amp: number;
  specs: Float32Array[];
  fft_size: number;
  hop_size: number;
}

export interface SpectrogramData {
  specs: Float32Array[];
  fft_size: number;
  hop_size: number;
  fs: number;
  max_amp: number;
}

export interface SpectrogramOverlay {
  f: number[];
  t?: number[];
  color?: string;
  lineWidth?: number;
  timeOffsetS?: number;
}

export interface SpectrogramPlotConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  spectrogram?: SpectrogramData;
  audioData?: AudioDataLike;
  fft_size?: number;
  hop_size?: number;
  overlays?: SpectrogramOverlay[];
}

export interface AuditoryToolboxOptions {
  recorderWorkletUrl?: string;
}

type RequireAtLeastOne<T, Keys extends keyof T> = Omit<T, Keys> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Omit<Pick<T, Keys>, K>>;
  }[Keys];

export interface RecordSessionController {
  id: string;
  startTime: number;
  endTime: number;
  stopAt: (contextTime: number) => void;
  stopNow: () => void;
  result: Promise<AudioData>;
}

export interface LoopbackTimingInfo {
  callPerformanceTime: number;
  afterMicTime?: number;
  afterBufferTime?: number;
  afterWorkletTime?: number;
  scheduledAtContext?: number;
  scheduledAtPerformance?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  stopEventContext?: number;
  stopEventPerformance?: number;
}

type LoopbackTimingOptionsBase = {
  startTime?: number;
  endTime?: number;
  delay?: number;
  duration?: number;
  debugTimings?: boolean;
  onTimings?: (timings: LoopbackTimingInfo) => void;
};

export type LoopbackTimingOptions = RequireAtLeastOne<
  RequireAtLeastOne<LoopbackTimingOptionsBase, 'endTime' | 'duration'>,
  'startTime' | 'delay'
>;

export type SearchRangeHz = [number, number];

export interface LoopbackMetaData {
  id: string;
  userAgent: string;
  signal: string;
  result?: PitchTrackObject;
}
