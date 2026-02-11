export class AudioData {
  channels: Float32Array[];
  fs: number;

  constructor(channels: Float32Array[], fs: number) {
    if (!channels.length) {
      throw new Error('At least one channel must be provided.');
    }

    if (channels.length > 1) {
      if (
        !channels.every((subArray) => subArray.length === channels[0].length)
      ) {
        throw new Error('All channels must be the same length');
      }
    }

    this.channels = channels;
    this.fs = fs;
  }

  multiply(): Float32Array {
    if (this.channels.length != 2) {
      throw new Error('multiply method requires 2 (and only 2) channels');
    }

    const mix = new Float32Array(this.channels[0].length);

    for (let i = 0; i < mix.length; i++) {
      mix[i] = this.channels[0][i] * this.channels[1][i];
    }

    return mix;
  }

  toAudioBuffer(context: AudioContext): AudioBuffer {
    const audioBuffer = context.createBuffer(
      this.channels.length,
      this.channels[0].length,
      context.sampleRate,
    );
    this.channels.forEach((channelData, index) => {
      const channel =
        channelData.buffer instanceof ArrayBuffer
          ? (channelData as Float32Array<ArrayBuffer>)
          : (new Float32Array(channelData) as Float32Array<ArrayBuffer>);
      audioBuffer.copyToChannel(channel, index);
    });
    return audioBuffer;
  }
}
