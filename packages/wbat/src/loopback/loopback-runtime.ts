import { AudioData, AudioDataSource } from '../core';
import type { AudioTiming } from '../timing';
import type {
  LoopbackTimingInfo,
  LoopbackTimingOptions,
  RecordSessionController,
} from '../types';

type SaveWAV = (id: string, pcmBuffer: AudioBuffer) => Promise<void>;

export interface LoopbackRuntimeOptions {
  recorderWorkletUrl?: string;
}

export class LoopbackRuntime {
  private audioContext: AudioContext;
  private timing: AudioTiming;
  private fs: number;
  private generateUniqueId: () => string;
  private saveWAV: SaveWAV;
  private recorderWorkletName: string = 'recorder-worklet';
  private recorderWorkletUrl: string;
  private loadedRecorderWorkletUrl: string | null = null;
  private stream: MediaStream | null = null;
  private pcmBuffer: AudioBuffer | null = null;

  constructor(
    audioContext: AudioContext,
    timing: AudioTiming,
    fs: number,
    generateUniqueId: () => string,
    saveWAV: SaveWAV,
    options: LoopbackRuntimeOptions = {},
  ) {
    this.audioContext = audioContext;
    this.timing = timing;
    this.fs = fs;
    this.generateUniqueId = generateUniqueId;
    this.saveWAV = saveWAV;
    this.recorderWorkletUrl =
      options.recorderWorkletUrl ||
      new URL('./worklets/recorder-worklet.js', import.meta.url).href;
  }

  getPCMBuffer(): AudioBuffer | null {
    return this.pcmBuffer;
  }

  getRecorderWorkletUrl(): string {
    return this.recorderWorkletUrl;
  }

  setRecorderWorkletUrl(url: string): void {
    this.recorderWorkletUrl = url;
    this.loadedRecorderWorkletUrl = null;
  }

  async loadAudioBuffer(filePath: string): Promise<AudioBuffer> {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  async prepareAudioBuffer(
    source: string | AudioBuffer | AudioData,
  ): Promise<AudioBuffer> {
    if (typeof source === 'string') {
      return this.loadAudioBuffer(source);
    }
    if (source instanceof AudioBuffer) {
      return source;
    }
    if (source instanceof AudioData) {
      return new AudioDataSource(this.audioContext, source).getAudioBuffer();
    }
    throw new Error('play method expects a file path or an AudioBuffer');
  }

  async play(
    source: string | AudioBuffer | AudioData,
    delay: number = 0,
  ): Promise<void> {
    try {
      await this.ensureAudioContextRunning();
      const buffer = await this.prepareAudioBuffer(source);
      const audioSource = this.audioContext.createBufferSource();
      audioSource.buffer = buffer;
      audioSource.connect(this.audioContext.destination);
      this.timing.setStartTime(delay);
      audioSource.start(this.timing.startTime);
    } catch (error) {
      console.error('Error during playback:', error);
      throw error;
    }
  }

  async requestMicrophoneAccess(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted.');

      stream.getTracks().forEach((track) => track.stop());
      this.stream = stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  async prepareMicStream(): Promise<void> {
    if (
      !this.stream ||
      this.stream.getTracks().every((track) => track.readyState === 'ended')
    ) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
    }
  }

  // Returns a session controller and stores the final recording via saveWAV callback.
  async record(
    delay: number = 0,
    duration: number = 1,
  ): Promise<RecordSessionController> {
    await this.ensureAudioContextRunning();
    await this.prepareMicStream();
    await this.ensureRecorderWorkletLoaded();

    const mediaStreamNode = this.audioContext.createMediaStreamSource(
      this.stream!,
    );
    const micProcessor = new AudioWorkletNode(
      this.audioContext,
      this.recorderWorkletName,
      {
        processorOptions: { numChannels: 1 },
      },
    );
    mediaStreamNode.connect(micProcessor);

    this.timing.setStartTime(delay);
    const startTime = this.timing.startTime;
    const endTime = startTime + duration;

    const param = micProcessor.parameters.get('isRecording');
    if (param) {
      param.setValueAtTime(1, this.timing.startTime);
      param.setValueAtTime(0, endTime);
    } else {
      throw new Error(
        'Parameter "isRecording" is not found on the AudioWorkletNode.',
      );
    }

    const id = this.generateUniqueId();
    const pcmChunks: Float32Array[] = [];
    const result = new Promise<AudioData>((resolve) => {
      micProcessor.port.onmessage = (event) => {
        if (event.data.eventType === 'data') {
          const channelData = event.data.audioBuffer?.[0];
          if (channelData instanceof Float32Array) {
            pcmChunks.push(new Float32Array(channelData));
          } else if (Array.isArray(channelData)) {
            pcmChunks.push(Float32Array.from(channelData));
          }
        }
        if (event.data.eventType === 'stop') {
          const pcmData = this.mergeChunks(pcmChunks);
          const audioData = new AudioData([pcmData], this.fs);
          this.pcmBuffer = audioData.toAudioBuffer(this.audioContext);
          void this.saveWAV(id, this.pcmBuffer);
          resolve(audioData);
        }
      };
    });

    const session: RecordSessionController = {
      id,
      startTime,
      endTime,
      stopAt: (contextTime: number) => {
        if (param) {
          param.cancelScheduledValues(contextTime);
          param.setValueAtTime(0, contextTime);
          session.endTime = contextTime;
        }
      },
      stopNow: () => {
        const stopTime = this.audioContext.currentTime;
        if (param) {
          param.cancelScheduledValues(stopTime);
          param.setValueAtTime(0, stopTime);
          session.endTime = stopTime;
        }
      },
      result,
    };

    return session;
  }

  // Need to adapt this to work with stereo AudioBuffers.
  createBufferFromPCM(
    pcmData: Array<number> | Float32Array,
    sampleRate: number = this.fs,
  ): AudioBuffer {
    const pcm =
      pcmData instanceof Float32Array ? pcmData : Float32Array.from(pcmData);
    const buffer = this.audioContext.createBuffer(1, pcm.length, sampleRate);
    const pcmChannel =
      pcm.buffer instanceof ArrayBuffer
        ? (pcm as Float32Array<ArrayBuffer>)
        : (new Float32Array(pcm) as Float32Array<ArrayBuffer>);
    buffer.copyToChannel(pcmChannel, 0, 0);
    return buffer;
  }

  mergeChunks(chunks: Float32Array[]): Float32Array {
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  async prepareAudioSource(source: AudioData): Promise<AudioBuffer> {
    if (source instanceof AudioData) {
      return new AudioDataSource(this.audioContext, source).getAudioBuffer();
    }
    throw new Error('Failed to prepare audio source');
  }

  // Record both stimulus and response as stereo channels of an AudioBuffer.
  // This is intentionally opinionated about scheduling: we warn and clamp
  // any startTime that is in the past or too close to "now".
  // TODO: Keep recordings bounded. If we add a session controller later, make
  // maxDuration explicit rather than allowing open-ended recordings.
  async virtualLoopback(
    source: string | AudioBuffer,
    options: LoopbackTimingOptions,
  ): Promise<AudioData> {
    try {
      const timings: LoopbackTimingInfo = {
        callPerformanceTime: performance.now(),
      };
      await this.ensureAudioContextRunning();
      await this.prepareMicStream();
      timings.afterMicTime = performance.now();
      const mediaStreamNode = this.audioContext.createMediaStreamSource(
        this.stream!,
      );

      const buffer = await this.prepareAudioBuffer(source);
      timings.afterBufferTime = performance.now();
      const audioSource = this.audioContext.createBufferSource();
      audioSource.buffer = buffer;

      await this.ensureRecorderWorkletLoaded();
      timings.afterWorkletTime = performance.now();

      const recorder = new AudioWorkletNode(
        this.audioContext,
        this.recorderWorkletName,
        {
          processorOptions: { numChannels: 2 },
        },
      );

      const merger = this.audioContext.createChannelMerger(2);
      audioSource.connect(this.audioContext.destination);
      mediaStreamNode.connect(merger, 0, 1);
      audioSource.connect(merger, 0, 0);
      merger.connect(recorder);

      const { startTime, endTime } = this.resolveLoopbackWindow(options);
      timings.scheduledAtContext = this.audioContext.currentTime;
      timings.scheduledAtPerformance = performance.now();
      timings.scheduledStartTime = startTime;
      timings.scheduledEndTime = endTime;

      audioSource.start(startTime);
      recorder.parameters.get('isRecording')!.setValueAtTime(1, startTime);
      recorder.parameters.get('isRecording')!.setValueAtTime(0, endTime);

      const pcmMic: Float32Array[] = [];
      const pcmStim: Float32Array[] = [];

      return new Promise((resolve, reject) => {
        recorder.port.onmessage = (event: MessageEvent) => {
          if (event.data.eventType == 'data') {
            pcmStim.push(new Float32Array(event.data.audioBuffer[0]));
            pcmMic.push(new Float32Array(event.data.audioBuffer[1]));
          }
          if (event.data.eventType == 'stop') {
            try {
              const pcmData = [
                this.mergeChunks(pcmStim),
                this.mergeChunks(pcmMic),
              ];
              timings.stopEventContext = this.audioContext.currentTime;
              timings.stopEventPerformance = performance.now();
              if (options.debugTimings) {
                console.log('virtualLoopback timings', timings);
              }
              if (options.onTimings) {
                options.onTimings(timings);
              }
              resolve(new AudioData(pcmData, this.fs));
            } catch (error) {
              console.error(`Error processing PCM data: ${error}`);
              reject(error);
            }
          }
        };
      });
    } catch (error) {
      console.error('Error in virtualLoopback:', error);
      throw error;
    }
  }

  private async ensureRecorderWorkletLoaded(): Promise<void> {
    if (this.loadedRecorderWorkletUrl === this.recorderWorkletUrl) {
      return;
    }

    await this.audioContext.audioWorklet.addModule(this.recorderWorkletUrl);
    this.loadedRecorderWorkletUrl = this.recorderWorkletUrl;
  }

  private async ensureAudioContextRunning(): Promise<void> {
    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume();
    }
  }

  private resolveLoopbackWindow(options: LoopbackTimingOptions): {
    startTime: number;
    endTime: number;
  } {
    const hasStart = typeof options.startTime === 'number';
    const hasEnd = typeof options.endTime === 'number';
    const hasDelay = typeof options.delay === 'number';
    const hasDuration = typeof options.duration === 'number';
    const minLeadTime = 0.05;
    const now = this.audioContext.currentTime;

    if (!hasStart && !hasDelay) {
      throw new Error('virtualLoopback requires a startTime or delay.');
    }
    if (!hasEnd && !hasDuration) {
      throw new Error('virtualLoopback requires an endTime or duration.');
    }

    let startTime = hasStart
      ? options.startTime!
      : this.timing.setStartTime(options.delay!);
    let endTime = hasEnd ? options.endTime! : startTime + options.duration!;

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      throw new Error('virtualLoopback timing options must be finite numbers.');
    }

    if (startTime <= now + minLeadTime) {
      console.warn(
        `virtualLoopback startTime (${startTime.toFixed(4)}) is too close to now ` +
          `(${now.toFixed(4)}). Clamping to ${minLeadTime}s in the future.`,
      );
      // TODO: Decide on strategy when requested startTime is in the past:
      // (A) preserve intended duration, or (B) preserve endTime if in future.
      const impliedDuration = hasEnd ? endTime - startTime : options.duration!;
      startTime = now + minLeadTime;
      if (!hasEnd) {
        endTime = startTime + impliedDuration;
      }
    }

    return { startTime, endTime };
  }
}
