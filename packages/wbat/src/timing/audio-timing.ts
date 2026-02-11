export class AudioTiming {
  private audioContext: AudioContext;
  private _pStartTime: number = 0;
  private _startTime: number = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  get startTime(): number {
    return this._startTime;
  }

  getTimestamp(): AudioTimestamp {
    return this.audioContext.getOutputTimestamp();
  }

  async getLag(): Promise<number> {
    const ts = await this.audioContext.getOutputTimestamp();
    if (this.checkTimestampRatio()) {
      if (
        typeof ts.performanceTime !== 'undefined' &&
        typeof ts.contextTime !== 'undefined'
      ) {
        ts.contextTime = ts.contextTime * 1000;
        const lag =
          ts.performanceTime -
          ts.contextTime -
          (this._pStartTime - this._startTime);
        return lag;
      }
    }

    throw new Error('Something went wrong');
  }

  // Schedule a callback for synchronising AV
  // Probably want to use this.AudioContext.getOutputTimestamp() and schedule
  // in a way that's optimised for DOM
  async scheduleAnimationFrame(time: number): Promise<void> {
    console.log(
      `This is an unimplemented method that takes time (${time}) as an argument`,
    );
  }

  // Convert time relative to startTime to performance time
  convertTime(time: number): number {
    const ts = this.audioContext.getOutputTimestamp();
    if (this.checkTimestampRatio()) {
      if (
        typeof ts.performanceTime !== 'undefined' &&
        typeof ts.contextTime !== 'undefined'
      ) {
        const audioTime = ts.contextTime * 1000;
        const timeDiff = ts.performanceTime - audioTime;
        return time * 1000 + timeDiff;
      }
    }

    throw new Error('Something went wrong');
  }

  /**
   * Checks the ratio of contextTime to currentTime and validates against a threshold.
   * Incorporates fixes for known browser-specific issues with Web Audio API.
   *
   * Experimental: Safari behaviour may have changed since the original bug was
   * observed. Keep this out of the stable API surface until a browser test
   * matrix confirms current behaviour.
   *
   * @param threshold A numeric threshold that the ratio should not exceed.
   * @returns boolean True if the ratio is below the threshold; otherwise, throws an error.
   */
  checkTimestampRatio(threshold: number = 10): boolean {
    const ts = this.audioContext.getOutputTimestamp();
    const currentTime = this.audioContext.currentTime;

    // Ensure both performanceTime and contextTime are defined
    if (
      typeof ts.performanceTime === 'undefined' ||
      typeof ts.contextTime === 'undefined'
    ) {
      throw new Error('Timestamp data is incomplete.');
    }

    const ratioDetails =
      `currentTime: ${currentTime} | contextTime: ${ts.contextTime} | ` +
      `ratio: ${currentTime / ts.contextTime}`;

    // Calculate the initial ratio
    let ratio = currentTime / ts.contextTime;

    // Check the first ratio against the threshold
    if (ratio < threshold) {
      return true;
    }

    // Correct the time based on the audio context's sample rate and recalculate the ratio
    const correctedTime = ts.contextTime * this.audioContext.sampleRate;
    ratio = currentTime / correctedTime;

    // Check the corrected ratio against the threshold
    if (Math.abs(ratio) < threshold) {
      throw new Error(
        `Detected potential Safari timestamp issue. ${ratioDetails}`,
      );
    }

    // If neither condition is met, throw a general error
    throw new Error(`Unknown timestamp ratio issue detected. ${ratioDetails}`);
  }

  setStartTime(delay: number = 0): number {
    const ts = this.getTimestamp();
    if (
      typeof ts.performanceTime !== 'undefined' &&
      typeof ts.contextTime !== 'undefined'
    ) {
      this._startTime = ts.contextTime + delay;
      this._pStartTime = ts.performanceTime + 1000 * delay;
      return this._startTime;
    }

    return 0;
  }
}
