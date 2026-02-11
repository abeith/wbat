// Adapted from https://gist.github.com/flpvsk/047140b31c968001dc563998f7440cc1

/* global AudioWorkletProcessor */
/* global registerProcessor */

class RecorderWorkletProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'isRecording',
        defaultValue: 0,
      },
    ];
  }

  constructor(options) {
    super();
    this._numChannels = options.processorOptions.numChannels || 1;
    this._bufferSize = 2048;
    this._buffers = Array.from(
      { length: this._numChannels },
      () => new Float32Array(this._bufferSize),
    );
    // this._buffer = new Float32Array(this._bufferSize);
    this._initBuffer();
  }

  _initBuffer() {
    this._bytesWritten = 0;
  }

  _isBufferEmpty() {
    return this._bytesWritten === 0;
  }

  _isBufferFull() {
    return this._bytesWritten === this._bufferSize;
  }

  _appendToBuffer(value, channel) {
    if (this._isBufferFull()) {
      this._flush();
    }

    if (channel < this._numChannels) {
      this._buffers[channel][this._bytesWritten] = value;
    }

    if (channel == 0) {
      this._bytesWritten += 1;
    }
  }

  _flush() {
    let buffers = this._buffers;
    for (let buffer in buffers) {
      if (this._bytesWritten < this._bufferSize) {
        buffer = buffer.slice(0, this._bytesWritten);
      }
    }

    this.port.postMessage({
      eventType: 'data',
      audioBuffer: buffers,
    });

    this._initBuffer();
  }

  _recordingStopped() {
    this.port.postMessage({
      eventType: 'stop',
    });
  }

  _rms(buffer) {
    let sqr = buffer.map((x) => x * x);
    let sum = sqr.reduce((a, b) => a + b);
    let mean = sum / buffer.length;
    return Math.sqrt(mean);
  }

  process(inputs, outputs, parameters) {
    const isRecordingValues = parameters.isRecording;
    let input = inputs[0];
    let output = outputs[0];
    for (let channel = 0; channel < input.length; channel++) {
      output[channel].set(input[channel]);
    }

    for (let dataIndex = 0; dataIndex < output[0].length; dataIndex++) {
      const shouldRecord =
        (isRecordingValues.length > 1
          ? isRecordingValues[dataIndex]
          : isRecordingValues[0]) === 1;

      if (!shouldRecord && !this._isBufferEmpty()) {
        this._flush();
        this._recordingStopped();
        return false;
      }

      if (shouldRecord) {
        for (let channel = 0; channel < input.length; channel++) {
          this._appendToBuffer(outputs[0][channel][dataIndex], channel);
        }
      }
    }

    return true;
  }
}

registerProcessor('recorder-worklet', RecorderWorkletProcessor);
