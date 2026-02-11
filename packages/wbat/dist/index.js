function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var audiobufferToWav = audioBufferToWav;
function audioBufferToWav (buffer, opt) {
  opt = opt || {};

  var numChannels = buffer.numberOfChannels;
  var sampleRate = buffer.sampleRate;
  var format = opt.float32 ? 3 : 1;
  var bitDepth = format === 3 ? 32 : 16;

  var result;
  if (numChannels === 2) {
    result = interleave$1(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  return encodeWAV(result, format, sampleRate, numChannels, bitDepth)
}

function encodeWAV (samples, format, sampleRate, numChannels, bitDepth) {
  var bytesPerSample = bitDepth / 8;
  var blockAlign = numChannels * bytesPerSample;

  var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString$1(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  /* RIFF type */
  writeString$1(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString$1(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString$1(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true);
  if (format === 1) { // Raw PCM
    floatTo16BitPCM(view, 44, samples);
  } else {
    writeFloat32(view, 44, samples);
  }

  return buffer
}

function interleave$1 (inputL, inputR) {
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0;
  var inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result
}

function writeFloat32 (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    output.setFloat32(offset, input[i], true);
  }
}

function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString$1 (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

var audioBufferToWav$1 = /*@__PURE__*/getDefaultExportFromCjs(audiobufferToWav);

/*
 * Copyright (c) 2019 Rafael da Silva Rocha.
 * Copyright (c) 2017 Brett Zamir, 2012 Niklas von Hertzen
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encode a byte buffer as a base64 string.
 * @param {!Uint8Array} bytes The buffer.
 * @return {string} A .wav file as a DataURI.
 */
function encode$3(bytes) {
  /** @type {string} */
  let base64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
    base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
    base64 += chars[bytes[i + 2] & 63];
  }
  if (bytes.length % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + '=';
  } else if (bytes.length % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + '==';
  }
  return base64;
}

/**
 * Decode a base64 string as a byte as buffer.
 * @param {string} base64 A .wav file as a DataURI.
 * @return {!Uint8Array} A .wav file as a DataURI.
 */
function decode$3(base64) {
  /** @type {!Uint8Array} */
  let lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  /** @type {number} */
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }
  /** @type {!Uint8Array} */
  let bytes = new Uint8Array(bufferLength);
  for (let i = 0, j = 0; i < base64.length; i += 4) {
    /** @type {number} */
    let encoded1 = lookup[base64.charCodeAt(i)];
    /** @type {number} */
    let encoded2 = lookup[base64.charCodeAt(i + 1)];
    /** @type {number} */
    let encoded3 = lookup[base64.charCodeAt(i + 2)];
    /** @type {number} */
    let encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[j++] = encoded1 << 2 | encoded2 >> 4;
    bytes[j++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[j++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return bytes;
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview A module to change the bit depth of PCM samples.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/rochars/bitdepth
 */

/**
 * Change the bit depth of PCM samples.
 * @param {!Array|!TypedArray} samples The original samples.
 * @param {string} bithDepth The original bit depth.
 * @param {!TypedArray} newSamples The output array.
 * @param {string} targetBitDepth The target bit depth.
 * @throws {Error} If original or target bit depths are not valid.
 */
function changeBitDepth(samples, bithDepth, newSamples, targetBitDepth) {
  // float to float, just copy the values
  if (["32f","64"].indexOf(bithDepth) > -1 &&
    ["32f","64"].indexOf(targetBitDepth) > -1) {
    newSamples.set(samples);
    return;
  }
  validateBitDepth_(bithDepth);
  validateBitDepth_(targetBitDepth);
  /** @type {!Function} */
  let toFunction = getBitDepthFunction_(bithDepth, targetBitDepth);
  /** @type {!Object<string, number>} */
  let options = {
    oldMin: Math.pow(2, parseInt(bithDepth, 10)) / 2,
    newMin: Math.pow(2, parseInt(targetBitDepth, 10)) / 2,
    oldMax: (Math.pow(2, parseInt(bithDepth, 10)) / 2) - 1,
    newMax: (Math.pow(2, parseInt(targetBitDepth, 10)) / 2) - 1,
  };
  // sign the samples if original is 8-bit
  sign8Bit_(bithDepth, samples, true);
  // change the resolution of the samples
  for (let i = 0, len = samples.length; i < len; i++) {        
    newSamples[i] = toFunction(samples[i], options);
  }
  // unsign the samples if target is 8-bit
  sign8Bit_(targetBitDepth, newSamples, false);
}

/**
 * Change the bit depth from int to int.
 * @param {number} sample The sample.
 * @param {!Object<string, number>} args Data about the bit depths.
 * @return {number}
 * @private
 */
function intToInt_(sample, args) {
  if (sample > 0) {
    sample = parseInt((sample / args.oldMax) * args.newMax, 10);
  } else {
    sample = parseInt((sample / args.oldMin) * args.newMin, 10);
  }
  return sample;
}

/**
 * Change the bit depth from float to int.
 * @param {number} sample The sample.
 * @param {!Object<string, number>} args Data about the bit depths.
 * @return {number}
 * @private
 */
function floatToInt_(sample, args) {
  return parseInt(
    sample > 0 ? sample * args.newMax : sample * args.newMin, 10);
}

/**
 * Change the bit depth from int to float.
 * @param {number} sample The sample.
 * @param {!Object<string, number>} args Data about the bit depths.
 * @return {number}
 * @private
 */
function intToFloat_(sample, args) {
  return sample > 0 ? sample / args.oldMax : sample / args.oldMin;
}

/**
 * Return the function to change the bit depth of a sample.
 * @param {string} original The original bit depth of the data.
 * @param {string} target The new bit depth of the data.
 * @return {!Function}
 * @private
 */
function getBitDepthFunction_(original, target) {
  /** @type {!Function} */
  let func = function(x) {return x;};
  if (original != target) {
    if (["32f", "64"].includes(original)) {
      func = floatToInt_;
    } else {
      if (["32f", "64"].includes(target)) {
        func = intToFloat_;
      } else {
        func = intToInt_;
      }
    }
  }
  return func;
}

/**
 * Validate the bit depth.
 * @param {string} bitDepth The original bit depth.
 * @throws {Error} If bit depth is not valid.
 * @private
 */
function validateBitDepth_(bitDepth) {
  if ((bitDepth != "32f" && bitDepth != "64") &&
      (parseInt(bitDepth, 10) < "8" || parseInt(bitDepth, 10) > "53")) {
    throw new Error("Invalid bit depth.");
  }
}

/**
 * Sign samples if they are 8-bit.
 * @param {string} bitDepth The bit depth code.
 * @param {!Array|!TypedArray} samples The samples.
 * @param {boolean} sign True to sign, false to unsign.
 * @private
 */
function sign8Bit_(bitDepth, samples, sign) {
  if (bitDepth == "8") {
    let factor = sign ? -128 : 128;
    for (let i = 0, len = samples.length; i < len; i++) {
      samples[i] = samples[i] += factor;
    }
  }
}

/*
 * imaadpcm: IMA ADPCM codec in JavaScript.
 * Copyright (c) 2018-2019 Rafael da Silva Rocha.
 * Copyright (c) 2016 acida. MIT License.  
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview IMA ADPCM codec.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/rochars/imaadpcm
 */

/**
 * @type {!Array<number>}
 * @private
 */
const INDEX_TABLE = [
    -1, -1, -1, -1, 2, 4, 6, 8,
    -1, -1, -1, -1, 2, 4, 6, 8];
/**
 * @type {!Array<number>}
 * @private
 */
const STEP_TABLE = [
    7, 8, 9, 10, 11, 12, 13, 14,
    16, 17, 19, 21, 23, 25, 28, 31,
    34, 37, 41, 45, 50, 55, 60, 66,
    73, 80, 88, 97, 107, 118, 130, 143,
    157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658,
    724, 796, 876, 963, 1060, 1166, 1282, 1411,
    1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024,
    3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484,
    7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794,
    32767];

/**
 * Encode 16-bit PCM samples into 4-bit IMA ADPCM samples.
 * @param {!Int16Array} samples A array of samples.
 * @return {!Uint8Array}
 */
function encode$2(samples) {
  /** @type {!Object} */
  let state = {
    index: 0,
    predicted: 0};
  /** @type {!Uint8Array} */
  let adpcmSamples = new Uint8Array((samples.length));
  /** @type {!Array<number>} */
  let block = [];
  /** @type {number} */
  let fileIndex = 0;
  /** @type {number} */
  let blockCount = 0;
  for (let i = 0, len = samples.length; i < len; i++) {
    if ((i % 505 == 0 && i != 0)) {
      adpcmSamples.set(encodeBlock(block, state), fileIndex);
      fileIndex += 256;
      block = [];
      blockCount++;
    }
    block.push(samples[i]);
  }
  let samplesLength = samples.length / 2;
  if (samplesLength % 2) {
    samplesLength++;
  }
  return adpcmSamples.slice(0, samplesLength + 512 + blockCount * 4);
}

/**
 * Decode IMA ADPCM samples into 16-bit PCM samples.
 * @param {!Uint8Array} adpcmSamples A array of ADPCM samples.
 * @param {number} blockAlign The block size.
 * @return {!Int16Array}
 */
function decode$2(adpcmSamples, blockAlign=256) {
  /** @type {!Object} */
  let state = {
    index: 0,
    predicted: 0,
    step: 7
  };
  /** @type {!Int16Array} */
  let samples = new Int16Array(adpcmSamples.length * 2);
  /** @type {!Array<number>} */
  let block = [];
  /** @type {number} */
  let fileIndex = 0;
  for (let i = 0, len = adpcmSamples.length; i < len; i++) {
    if (i % blockAlign == 0 && i != 0) {            
      let decoded = decodeBlock(block, state);
      samples.set(decoded, fileIndex);
      fileIndex += decoded.length;
      block = [];
    }
    block.push(adpcmSamples[i]);
  }
  return samples;
}

/**
 * Encode a block of 505 16-bit samples as 4-bit ADPCM samples.
 * @param {!Array<number>} block A sample block of 505 samples.
 * @param {!Object} state The encoder state.
 * @return {!Array<number>}
 */
function encodeBlock(block, state) {
  /** @type {!Array<number>} */
  let adpcmSamples = blockHead_(block[0], state);
  for (let i = 3, len = block.length; i < len; i+=2) {
    /** @type {number} */
    let sample2 = encodeSample_(block[i], state);
    /** @type {number} */
    let sample = encodeSample_(block[i + 1], state);
    adpcmSamples.push((sample << 4) | sample2);
  }
  return adpcmSamples;
}

/**
 * Decode a block of ADPCM samples into 16-bit PCM samples.
 * @param {!Array<number>} block A adpcm sample block.
 * @param {!Object} state The decoder state.
 * @return {!Array<number>}
 */
function decodeBlock(block, state) {
  state.predicted = sign_((block[1] << 8) | block[0]);
  state.index = block[2];
  state.step = STEP_TABLE[state.index];
  /** @type {!Array<number>} */
  let result = [
      state.predicted,
      state.predicted
    ];
  for (let i = 4, len = block.length; i < len; i++) {
    /** @type {number} */
    let original_sample = block[i];
    /** @type {number} */
    let second_sample = original_sample >> 4;
    /** @type {number} */
    let first_sample = (second_sample << 4) ^ original_sample;
    result.push(decodeSample_(first_sample, state));
    result.push(decodeSample_(second_sample, state));
  }
  return result;
}

/**
 * Sign a 16-bit integer.
 * @param {number} num A 16-bit integer.
 * @return {number}
 * @private
 */
function sign_(num) {
  return num > 32768 ? num - 65536 : num;
}

/**
 * Compress a 16-bit PCM sample into a 4-bit ADPCM sample.
 * @param {number} sample The sample.
 * @param {!Object} state The encoder state.
 * @return {number}
 * @private
 */
function encodeSample_(sample, state) {
  /** @type {number} */
  let delta = sample - state.predicted;
  /** @type {number} */
  let value = 0;
  if (delta >= 0) {
    value = 0;
  } else {
    value = 8;
    delta = -delta;
  }
  /** @type {number} */
  let step = STEP_TABLE[state.index];
  /** @type {number} */
  let diff = step >> 3;
  if (delta > step) {
    value |= 4;
    delta -= step;
    diff += step;
  }
  step >>= 1;
  if (delta > step) {
    value |= 2;
    delta -= step;
    diff += step;
  }
  step >>= 1;
  if (delta > step) {
    value |= 1;
    diff += step;
  }
  updateEncoder_(value, diff, state);
  return value;
}

/**
 * Set the value for encoderPredicted_ and encoderIndex_
 * after each sample is compressed.
 * @param {number} value The compressed ADPCM sample
 * @param {number} diff The calculated difference
 * @param {!Object} state The encoder state.
 * @private
 */
function updateEncoder_(value, diff, state) {
  if (value & 8) {
    state.predicted -= diff;
  } else {
    state.predicted += diff;
  }
  if (state.predicted < -32768) {
    state.predicted = -32768;
  } else if (state.predicted > 0x7fff) {
    state.predicted = 0x7fff;
  }
  state.index += INDEX_TABLE[value & 7];
  if (state.index < 0) {
    state.index = 0;
  } else if (state.index > 88) {
    state.index = 88;
  }
}

/**
 * Decode a 4-bit ADPCM sample into a 16-bit PCM sample.
 * @param {number} nibble A 4-bit adpcm sample.
 * @param {!Object} state The decoder state.
 * @return {number}
 * @private
 */
function decodeSample_(nibble, state) {
  /** @type {number} */
  let difference = 0;
  if (nibble & 4) {
    difference += state.step;
  }
  if (nibble & 2) {
    difference += state.step >> 1;
  }
  if (nibble & 1) {
    difference += state.step >> 2;
  }
  difference += state.step >> 3;
  if (nibble & 8) {
    difference = -difference;
  }
  state.predicted += difference;
  if (state.predicted > 32767) {
    state.predicted = 32767;
  } else if (state.predicted < -32767) {
    state.predicted = -32767;
  }
  updateDecoder_(nibble, state);
  return state.predicted;
}

/**
 * Update the index and step after decoding a sample.
 * @param {number} nibble A 4-bit adpcm sample.
 * @param {!Object} state The decoder state.
 * @private
 */
function updateDecoder_(nibble, state) {
  state.index += INDEX_TABLE[nibble];
  if (state.index < 0) {
    state.index = 0;
  } else if (state.index > 88) {
    state.index = 88;
  }
  state.step = STEP_TABLE[state.index];
}

/**
 * Return the head of a ADPCM sample block.
 * @param {number} sample The first sample of the block.
 * @param {!Object} state The encoder state.
 * @return {!Array<number>}
 * @private
 */
function blockHead_(sample, state) {
  encodeSample_(sample, state);
  /** @type {!Array<number>} */
  let adpcmSamples = [];
  adpcmSamples.push(sample & 0xFF);
  adpcmSamples.push((sample >> 8) & 0xFF);
  adpcmSamples.push(state.index);
  adpcmSamples.push(0);
  return adpcmSamples;
}

/*
 * alawmulaw: A-Law and mu-Law codecs in JavaScript.
 * https://github.com/rochars/alawmulaw
 *
 * Copyright (c) 2018 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview A-Law codec.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/rochars/alawmulaw
 */

/** @type {!Array<number>} */
const LOG_TABLE = [
  1,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5, 
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6, 
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7, 
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7 
];

/**
 * Encode a 16-bit linear PCM sample as 8-bit A-Law.
 * @param {number} sample A 16-bit PCM sample
 * @return {number}
 */
function encodeSample$1(sample) {
  /** @type {number} */
  let compandedValue; 
  sample = (sample ==-32768) ? -32767 : sample;
  /** @type {number} */
  let sign = ((~sample) >> 8) & 0x80; 
  if (!sign) {
    sample = sample * -1; 
  }
  if (sample > 32635) {
    sample = 32635; 
  }
  if (sample >= 256)  {
    /** @type {number} */
    let exponent = LOG_TABLE[(sample >> 8) & 0x7F];
    /** @type {number} */
    let mantissa = (sample >> (exponent + 3) ) & 0x0F; 
    compandedValue = ((exponent << 4) | mantissa); 
  } else {
    compandedValue = sample >> 4; 
  } 
  return compandedValue ^ (sign ^ 0x55);
}

/**
 * Decode a 8-bit A-Law sample as 16-bit PCM.
 * @param {number} aLawSample The 8-bit A-Law sample
 * @return {number}
 */
function decodeSample$1(aLawSample) {
  /** @type {number} */
  let sign = 0;
  aLawSample ^= 0x55;
  if ((aLawSample & 0x80) !== 0) {
    aLawSample &= -129;
    sign = -1;
  }
  /** @type {number} */
  let position = ((aLawSample & 0xF0) >> 4) + 4;
  /** @type {number} */
  let decoded = 0;
  if (position != 4) {
    decoded = ((1 << position) |
      ((aLawSample & 0x0F) << (position - 4)) |
      (1 << (position - 5)));
  } else {
    decoded = (aLawSample << 1)|1;
  }
  decoded = (sign === 0) ? (decoded) : (-decoded);
  return (decoded * 8) * -1;
}

/**
 * Encode 16-bit linear PCM samples as 8-bit A-Law samples.
 * @param {!Int16Array} samples A array of 16-bit PCM samples.
 * @return {!Uint8Array}
 */
function encode$1(samples) {
  /** @type {!Uint8Array} */
  let aLawSamples = new Uint8Array(samples.length);
  for (let i = 0, len = samples.length; i < len; i++) {
    aLawSamples[i] = encodeSample$1(samples[i]);
  }
  return aLawSamples;
}

/**
 * Decode 8-bit A-Law samples into 16-bit linear PCM samples.
 * @param {!Uint8Array} samples A array of 8-bit A-Law samples.
 * @return {!Int16Array}
 */
function decode$1(samples) {
  /** @type {!Int16Array} */
  let pcmSamples = new Int16Array(samples.length);
  for (let i = 0, len = samples.length; i < len; i++) {
    pcmSamples[i] = decodeSample$1(samples[i]);
  }
  return pcmSamples;
}

/*
 * alawmulaw: A-Law and mu-Law codecs in JavaScript.
 * https://github.com/rochars/alawmulaw
 *
 * Copyright (c) 2018-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview mu-Law codec.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/rochars/alawmulaw
 */

/**
 * @type {number}
 * @private
 */
const BIAS = 0x84;
/**
 * @type {number}
 * @private
 */
const CLIP = 32635;
/**
 * @type {Array<number>}
 * @private
 */
const encodeTable = [
    0,0,1,1,2,2,2,2,3,3,3,3,3,3,3,3,
    4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7];
/**
 * @type {Array<number>}
 * @private
 */
const decodeTable = [0,132,396,924,1980,4092,8316,16764];

/**
 * Encode a 16-bit linear PCM sample as 8-bit mu-Law.
 * @param {number} sample A 16-bit PCM sample
 * @return {number}
 */
function encodeSample(sample) {
  /** @type {number} */
  let sign;
  /** @type {number} */
  let exponent;
  /** @type {number} */
  let mantissa;
  /** @type {number} */
  let muLawSample;
  /** get the sample into sign-magnitude **/
  sign = (sample >> 8) & 0x80;
  if (sign != 0) sample = -sample;
  /** convert from 16 bit linear to ulaw **/
  sample = sample + BIAS;
  if (sample > CLIP) sample = CLIP;
  exponent = encodeTable[(sample>>7) & 0xFF];
  mantissa = (sample >> (exponent+3)) & 0x0F;
  muLawSample = ~(sign | (exponent << 4) | mantissa);
  /** return the result **/
  return muLawSample;
}

/**
 * Decode a 8-bit mu-Law sample as 16-bit PCM.
 * @param {number} muLawSample The 8-bit mu-Law sample
 * @return {number}
 */
function decodeSample(muLawSample) {
  /** @type {number} */
  let sign;
  /** @type {number} */
  let exponent;
  /** @type {number} */
  let mantissa;
  /** @type {number} */
  let sample;
  muLawSample = ~muLawSample;
  sign = (muLawSample & 0x80);
  exponent = (muLawSample >> 4) & 0x07;
  mantissa = muLawSample & 0x0F;
  sample = decodeTable[exponent] + (mantissa << (exponent+3));
  if (sign != 0) sample = -sample;
  return sample;
}

/**
 * Encode 16-bit linear PCM samples into 8-bit mu-Law samples.
 * @param {!Int16Array} samples A array of 16-bit PCM samples.
 * @return {!Uint8Array}
 */
function encode(samples) {
  /** @type {!Uint8Array} */
  let muLawSamples = new Uint8Array(samples.length);
  for (let i = 0, len = samples.length; i < len; i++) {
    muLawSamples[i] = encodeSample(samples[i]);
  }
  return muLawSamples;
}

/**
 * Decode 8-bit mu-Law samples into 16-bit PCM samples.
 * @param {!Uint8Array} samples A array of 8-bit mu-Law samples.
 * @return {!Int16Array}
 */
function decode(samples) {
  /** @type {!Int16Array} */
  let pcmSamples = new Int16Array(samples.length);
  for (let i = 0, len = samples.length; i < len; i++) {
    pcmSamples[i] = decodeSample(samples[i]);
  }
  return pcmSamples;
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview A function to swap endianness in byte buffers.
 * @see https://github.com/rochars/byte-data
 * @see https://github.com/rochars/wavefile
 */

/**
 * Swap the byte ordering in a buffer. The buffer is modified in place.
 * @param {!(Array<number>|Uint8Array)} bytes The bytes.
 * @param {number} offset The byte offset.
 * @param {number=} [start=0] The start index.
 * @param {number=} [end=bytes.length] The end index.
 */
function endianness(bytes, offset, start=0, end=bytes.length) {
  for (let index = start; index < end; index += offset) {
    swap_(bytes, offset, index);
  }
}

/**
 * Swap the byte order of a value in a buffer. The buffer is modified in place.
 * @param {!(Array<number>|Uint8Array)} bytes The bytes.
 * @param {number} offset The byte offset.
 * @param {number} index The start index.
 * @private
 */
function swap_(bytes, offset, index) {
  offset--;
  for(let x = 0; x < offset; x++) {
    /** @type {number} */
    let theByte = bytes[index + x];
    bytes[index + x] = bytes[index + offset];
    bytes[index + offset] = theByte;
    offset--;
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview Encode and decode UTF8 strings to and from byte buffers.
 * @see https://github.com/rochars/byte-data
 * @see https://github.com/rochars/wavefile
 * @see https://encoding.spec.whatwg.org/#the-encoding
 * @see https://encoding.spec.whatwg.org/#utf-8-encoder
 */

/**
 * Read a string of UTF-8 characters from a byte buffer.
 * Invalid characters are replaced with 'REPLACEMENT CHARACTER' (U+FFFD).
 * @see https://encoding.spec.whatwg.org/#the-encoding
 * @see https://stackoverflow.com/a/34926911
 * @param {!Uint8Array|!Array<number>} buffer A byte buffer.
 * @param {number} [start=0] The buffer index to start reading.
 * @param {number} [end=0] The buffer index to stop reading.
 *   Assumes the buffer length if undefined.
 * @return {string}
 */
function unpack$1(buffer, start=0, end=buffer.length) {
  /** @type {string} */
  let str = '';
  for(let index = start; index < end;) {
    /** @type {number} */
    let lowerBoundary = 0x80;
    /** @type {number} */
    let upperBoundary = 0xBF;
    /** @type {boolean} */
    let replace = false;
    /** @type {number} */
    let charCode = buffer[index++];
    if (charCode >= 0x00 && charCode <= 0x7F) {
      str += String.fromCharCode(charCode);
    } else {
      /** @type {number} */
      let count = 0;
      if (charCode >= 0xC2 && charCode <= 0xDF) {
        count = 1;
      } else if (charCode >= 0xE0 && charCode <= 0xEF ) {
        count = 2;
        if (buffer[index] === 0xE0) {
          lowerBoundary = 0xA0;
        }
        if (buffer[index] === 0xED) {
          upperBoundary = 0x9F;
        }
      } else if (charCode >= 0xF0 && charCode <= 0xF4 ) {
        count = 3;
        if (buffer[index] === 0xF0) {
          lowerBoundary = 0x90;
        }
        if (buffer[index] === 0xF4) {
          upperBoundary = 0x8F;
        }
      } else {
        replace = true;
      }
      charCode = charCode & (1 << (8 - count - 1)) - 1;
      for (let i = 0; i < count; i++) {
        if (buffer[index] < lowerBoundary || buffer[index] > upperBoundary) {
          replace = true;
        }
        charCode = (charCode << 6) | (buffer[index] & 0x3f);
        index++;
      }
      if (replace) {
        str += String.fromCharCode(0xFFFD);
      } 
      else if (charCode <= 0xffff) {
        str += String.fromCharCode(charCode);
      } else {
        charCode -= 0x10000;
        str += String.fromCharCode(
          ((charCode >> 10) & 0x3ff) + 0xd800,
          (charCode & 0x3ff) + 0xdc00);
      }
    }
  }
  return str;
}

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @see https://encoding.spec.whatwg.org/#utf-8-encoder
 * @param {string} str The string to pack.
 * @param {!Uint8Array|!Array<number>} buffer The buffer to pack the string to.
 * @param {number=} index The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 */
function pack$1(str, buffer, index=0) {
  /** @type {number} */
  let i = 0;
  /** @type {number} */
  let len = str.length;
  while (i < len) {
    /** @type {number} */
    let codePoint = str.codePointAt(i);
    if (codePoint < 128) {
      buffer[index] = codePoint;
      index++;
    } else {
      /** @type {number} */
      let count = 0;
      /** @type {number} */
      let offset = 0;
      if (codePoint <= 0x07FF) {
        count = 1;
        offset = 0xC0;
      } else if(codePoint <= 0xFFFF) {
        count = 2;
        offset = 0xE0;
      } else if(codePoint <= 0x10FFFF) {
        count = 3;
        offset = 0xF0;
        i++;
      }
      buffer[index] = (codePoint >> (6 * count)) + offset;
      index++;
      while (count > 0) {
        buffer[index] = 0x80 | (codePoint >> (6 * (count - 1)) & 0x3F);
        index++;
        count--;
      }
    }
    i++;
  }
  return index;
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview Encode and decode int numbers to and from byte buffers.
 * @see https://github.com/rochars/byte-data
 * @see https://github.com/rochars/wavefile
 */

/**
 * A class to write and read integer numbers to and from byte buffers.
 */
class IntParser {
  
  /**
   * @param {number} bits The number of bits used by the integer.
   * @param {boolean} [signed=false] True for signed, false otherwise.
   */
  constructor(bits, signed=false) {
    /**
     * The number of bits used by one number.
     * @type {number}
     */
    this.bits = bits;
    /**
     * The number of bytes used by one number.
     * @type {number}
     */
    this.offset = Math.ceil(bits / 8);
    /**
     * @type {number}
     * @protected
     */
    this.max = Math.pow(2, bits) - 1;
    /**
     * @type {number}
     * @protected
     */
    this.min = 0;
    /**
     * @type {Function}
     */
    this.unpack = this.unpack_;
    if (signed) {
      this.max = Math.pow(2, bits) / 2 - 1;
      this.min = -this.max - 1;
      this.unpack = this.unpackSigned_;
    }
  }

  /**
   * Write one unsigned integer to a byte buffer.
   * @param {!(Uint8Array|Array<number>)} buffer An array of bytes.
   * @param {number} num The number. Overflows are truncated.
   * @param {number} [index=0] The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   */
  pack(buffer, num, index=0) {
    num = this.clamp_(Math.round(num));
    for (let i = 0, len = this.offset; i < len; i++) {
      buffer[index] = Math.floor(num / Math.pow(2, i * 8)) & 255;
      index++;
    }
    return index;
  }

  /**
   * Read one unsigned integer from a byte buffer.
   * Does not check for overflows.
   * @param {!(Uint8Array|Array<number>)} buffer An array of bytes.
   * @param {number} [index=0] The index to read.
   * @return {number}
   * @private
   */
  unpack_(buffer, index=0) {
    /** @type {number} */
    let num = 0;
    for(let x = 0; x < this.offset; x++) {
      num += buffer[index + x] * Math.pow(256, x);
    }
    return num;
  }

  /**
   * Read one two's complement signed integer from a byte buffer.
   * @param {!(Uint8Array|Array<number>)} buffer An array of bytes.
   * @param {number} [index=0] The index to read.
   * @return {number}
   * @private
   */
  unpackSigned_(buffer, index=0) {
    return this.sign_(this.unpack_(buffer, index));
  }

  /**
   * Clamp values on overflow.
   * @param {number} num The number.
   * @private
   */
  clamp_(num) {
    if (num > this.max) {
      return this.max;
    } else if (num < this.min) {
      return this.min;
    }
    return num;
  }

  /**
   * Sign a number.
   * @param {number} num The number.
   * @return {number}
   * @private
   */
  sign_(num) {
    if (num > this.max) {
      num -= (this.max * 2) + 2;
    }
    return num;
  }
}

/*
 * Copyright (c) 2018-2019 Rafael da Silva Rocha.
 * Copyright (c) 2013 DeNA Co., Ltd.
 * Copyright (c) 2010, Linden Research, Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview Encode and decode IEEE 754 floating point numbers.
 * @see https://github.com/rochars/byte-data
 * @see https://github.com/rochars/wavefile
 * @see https://bitbucket.org/lindenlab/llsd/raw/7d2646cd3f9b4c806e73aebc4b32bd81e4047fdc/js/typedarray.js
 * @see https://github.com/kazuho/ieee754.js/blob/master/ieee754.js
 */

/**
 * A class to encode and decode IEEE 754 floating-point numbers.
 */
class FloatParser {

  /**
   * Pack a IEEE 754 floating point number.
   * @param {number} ebits The exponent bits.
   * @param {number} fbits The fraction bits.
   */
  constructor(ebits, fbits) {
    /**
     * @type {number}
     */
    this.offset = Math.ceil((ebits + fbits) / 8);
    /**
     * @type {number}
     * @private
     */
    this.ebits = ebits;
    /**
     * @type {number}
     * @private
     */
    this.fbits = fbits;
    /**
     * @type {number}
     * @private
     */
    this.bias = (1 << (ebits - 1)) - 1;
    /**
     * @type {number}
     * @private
     */
    this.biasP2 = Math.pow(2, this.bias + 1);
    /**
     * @type {number}
     * @private
     */
    this.ebitsFbits = (ebits + fbits);
    /**
     * @type {number}
     * @private
     */
    this.fbias = Math.pow(2, -(8 * this.offset - 1 - ebits));
  }

  /**
   * Pack a IEEE 754 floating point number.
   * @param {!Uint8Array|!Array<number>} buffer The buffer.
   * @param {number} num The number.
   * @param {number} index The index to write on the buffer.
   * @return {number} The next index to write on the buffer.
   */
  pack(buffer, num, index) {
    // Round overflows
    if (Math.abs(num) > this.biasP2 - (this.ebitsFbits * 2)) {
      num = num < 0 ? -Infinity : Infinity;
    }
    /**
     * sign, need this to handle negative zero
     * @see http://cwestblog.com/2014/02/25/javascript-testing-for-negative-zero/
     * @type {number}
     */
    let sign = (((num = +num) || 1 / num) < 0) ? 1 : num < 0 ? 1 : 0;
    num = Math.abs(num);
    /** @type {number} */
    let exp = Math.min(Math.floor(Math.log(num) / Math.LN2), 1023);
    /** @type {number} */
    let fraction = roundToEven(num / Math.pow(2, exp) * Math.pow(2, this.fbits));
    // NaN
    if (num !== num) {
      fraction = Math.pow(2, this.fbits - 1);
      exp = (1 << this.ebits) - 1;
    // Number
    } else if (num !== 0) {
      if (num >= Math.pow(2, 1 - this.bias)) {
        if (fraction / Math.pow(2, this.fbits) >= 2) {
          exp = exp + 1;
          fraction = 1;
        }
        // Overflow
        if (exp > this.bias) {
          exp = (1 << this.ebits) - 1;
          fraction = 0;
        } else {
          exp = exp + this.bias;
          fraction = roundToEven(fraction) - Math.pow(2, this.fbits);
        }
      } else {
        fraction = roundToEven(num / Math.pow(2, 1 - this.bias - this.fbits));
        exp = 0;
      } 
    }
    return this.packFloatBits_(buffer, index, sign, exp, fraction);
  }

  /**
   * Unpack a IEEE 754 floating point number.
   * Derived from IEEE754 by DeNA Co., Ltd., MIT License. 
   * Adapted to handle NaN. Should port the solution to the original repo.
   * @param {!Uint8Array|!Array<number>} buffer The buffer.
   * @param {number} index The index to read from the buffer.
   * @return {number} The floating point number.
   */
  unpack(buffer, index) {
    /** @type {number} */
    let eMax = (1 << this.ebits) - 1;
    /** @type {number} */
    let significand;
    /** @type {string} */
    let leftBits = "";
    for (let i = this.offset - 1; i >= 0 ; i--) {
      /** @type {string} */
      let t = buffer[i + index].toString(2);
      leftBits += "00000000".substring(t.length) + t;
    }
    /** @type {number} */
    let sign = leftBits.charAt(0) == "1" ? -1 : 1;
    leftBits = leftBits.substring(1);
    /** @type {number} */
    let exponent = parseInt(leftBits.substring(0, this.ebits), 2);
    leftBits = leftBits.substring(this.ebits);
    if (exponent == eMax) {
      if (parseInt(leftBits, 2) !== 0) {
        return NaN;
      }
      return sign * Infinity;  
    } else if (exponent === 0) {
      exponent += 1;
      significand = parseInt(leftBits, 2);
    } else {
      significand = parseInt("1" + leftBits, 2);
    }
    return sign * significand * this.fbias * Math.pow(2, exponent - this.bias);
  }

  /**
   * Pack a IEEE754 from its sign, exponent and fraction bits
   * and place it in a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer The byte buffer to write to.
   * @param {number} index The buffer index to write.
   * @param {number} sign The sign.
   * @param {number} exp the exponent.
   * @param {number} fraction The fraction.
   * @return {number}
   * @private
   */
  packFloatBits_(buffer, index, sign, exp, fraction) {
    /** @type {!Array<number>} */
    let bits = [];
    // the sign
    bits.push(sign);
    // the exponent
    for (let i = this.ebits; i > 0; i -= 1) {
      bits[i] = (exp % 2 ? 1 : 0);
      exp = Math.floor(exp / 2);
    }
    // the fraction
    let len = bits.length;
    for (let i = this.fbits; i > 0; i -= 1) {
      bits[len + i] = (fraction % 2 ? 1 : 0);
      fraction = Math.floor(fraction / 2);
    }
    // pack as bytes
    /** @type {string} */
    let str = bits.join('');
    /** @type {number} */
    let offset = this.offset + index - 1;
    /** @type {number} */
    let k = index;
    while (offset >= index) {
      buffer[offset] = parseInt(str.substring(0, 8), 2);
      str = str.substring(8);
      offset--;
      k++;
    }
    return k;
  }
}

/**
 * Round a number to its nearest even value.
 * @param {number} n The number.
 * @return {number}
 * @private
 */
function roundToEven(n) {
  /** @type {number} */
  let w = Math.floor(n);
  let f = n - w;
  if (f < 0.5) {
    return w;
  }
  if (f > 0.5) {
    return w + 1;
  }
  return w % 2 ? w + 1 : w;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * Read a string of UTF-8 characters from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer A byte buffer.
 * @param {number} [index=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The index to stop reading, non inclusive.
 * @return {string}
 */
function unpackString(buffer, index=0, end=buffer.length) {
  return unpack$1(buffer, index, end);
}

/**
 * Write a string of UTF-8 characters as a byte buffer.
 * @param {string} str The string to pack.
 * @return {!Array<number>} The UTF-8 string bytes.
 */
function packString(str) {
  /** @type {!Array<number>} */
  let buffer = [];
  pack$1(str, buffer);
  return buffer;
}

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @param {string} str The string to pack.
 * @param {!(Uint8Array|Array<number>)} buffer The output buffer.
 * @param {number} [index=0] The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 */
function packStringTo(str, buffer, index=0) {
  return pack$1(str, buffer, index);
}

// Numbers
/**
 * Pack a array of numbers to a byte buffer.
 * All other packing functions are interfaces to this function.
 * @param {!(Array<number>|TypedArray)} values The values to pack.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {!(Uint8Array|Array<number>)} buffer The buffer to write on.
 * @param {number} [index=0] The buffer index to start writing.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 */
function packArrayTo(values, theType, buffer, index=0) {
  theType = theType || {};
  /** @type {!Object} */
  let packer = getParser_(theType.bits, theType.fp, theType.signed);
  /** @type {number} */
  let offset = Math.ceil(theType.bits / 8);
  /** @type {number} */
  let i = 0;
  /** @type {number} */
  let start = index;
  for (let valuesLen = values.length; i < valuesLen; i++) {
    index = packer.pack(buffer, values[i], index);
  }
  if (theType.be) {
    endianness(buffer, offset, start, index);
  }
  return index;
}

/**
 * Unpack a array of numbers from a byte buffer to a array or a typed array.
 * All other unpacking functions are interfaces to this function.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {!(TypedArray|Array<number>)} output The output array or typed array.
 * @param {number} [start=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The buffer index to stop reading.
 * @throws {Error} If the type definition is not valid.
 */
function unpackArrayTo(
    buffer, theType, output, start=0, end=buffer.length) {
  theType = theType || {};
  /** @type {!Object} */
  let parser = getParser_(theType.bits, theType.fp, theType.signed);
  // getUnpackLen_ will adjust the end index according to the size
  // of the input buffer and the byte offset or throw a error on bad
  // end index if safe=true
  end = getUnpackLen_(buffer, start, end, parser.offset);
  if (theType.be) {
    /** @type {!(Uint8Array|Array<number>)} */
    let readBuffer = copyBuffer_(buffer);
    if (theType.be) {
      endianness(readBuffer, parser.offset, start, end);
    }
    unpack_(readBuffer, output, start, end, parser);
  } else {
    unpack_(buffer, output, start, end, parser);
  }
}

/**
 * Pack a number to a byte buffer.
 * @param {number} value The value.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer to write on.
 * @param {number} [index=0] The buffer index to write.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 */
function packTo(value, theType, buffer, index=0) {
  return packArrayTo([value], theType, buffer, index);
}

/**
 * Pack a number as a array of bytes.
 * @param {number} value The number to pack.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @return {!Array<number>} The packed value.
 * @throws {Error} If the type definition is not valid.
 */
function pack(value, theType) {
  /** @type {!Array<number>} */
  let output = [];
  packTo(value, theType, output, 0);
  return output;
}

/**
 * Unpack a number from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {number} [index=0] The buffer index to read.
 * @return {number}
 * @throws {Error} If the type definition is not valid.
 */
function unpack(buffer, theType, index=0) {
  let output = [];
  unpackArrayTo(buffer, theType, output,
    index, index + Math.ceil(theType.bits / 8));
  return output[0];
}

/**
 * Unpack a array of numbers from a byte buffer to a array or a typed array.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!(TypedArray|Array<number>)} output The output array or typed array.
 * @param {number} start The buffer index to start reading.
 * @param {number} end The buffer index to stop reading.
 * @param {!Object} parser The parser.
 * @private
 */
function unpack_(buffer, output, start, end, parser) {
  /** @type {number} */
  let offset = parser.offset;
  for (let index = 0, j = start; j < end; j += offset, index++) {
    output[index] = parser.unpack(buffer, j);
  }
}

/**
 * Copy a byte buffer as a Array or Uint8Array.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @return {!(Uint8Array|Array<number>)}
 * @private
 */
function copyBuffer_(buffer) {
  return new Uint8Array(buffer);
}

/**
 * Adjust the end index according to the input buffer length and the
 * type offset.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {number} start The buffer index to start reading.
 * @param {number} end The buffer index to stop reading.
 * @param {number} offset The number of bytes used by the type.
 * @private
 */
function getUnpackLen_(buffer, start, end, offset) {
  /** @type {number} */
  let extra = (end - start) % offset;
  return end - extra;
}

/**
 * Return a parser for int, uint or fp numbers.
 * @param {number} bits The number of bits.
 * @param {boolean|undefined} fp True for fp numbers, false otherwise.
 * @param {boolean|undefined} signed True for signed ints, false otherwise.
 * @return {!Object}
 * @private
 */
function getParser_(bits, fp, signed) {
  if (fp && bits == 32) {
    return new FloatParser(8, 23);
  } else if(fp && bits == 64) {
    return new FloatParser(11, 52);
  }
  return new IntParser(bits, signed);
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to perform low-level reading of RIFF/RIFX files.
 */
class RIFFFile {

  constructor() {
    /**
     * The container identifier.
     * 'RIFF', 'RIFX' and 'RF64' are supported.
     * @type {string}
     */
    this.container = '';
    /**
     * @type {number}
     */
    this.chunkSize = 0;
    /**
     * The format.
     * @type {string}
     */
    this.format = '';
    /**
     * A object defining the start and end of all chunks in a wav buffer.
     * @type {Object}
     */
    this.signature = null;
    /**
     * @type {number}
     * @protected
     */
    this.head = 0;
    /**
     * @type {!{bits: number, be: boolean}}
     * @protected
     */
    this.uInt32 = {bits: 32, be: false};
    /**
     * The list of supported containers.
     * Any format different from RIFX will be treated as RIFF.
     * @type {!Array<string>}
     * @protected
     */
    this.supported_containers = ['RIFF', 'RIFX'];
  }

  /**
   * Read the signature of the chunks in a RIFF/RIFX file.
   * @param {!Uint8Array} buffer The file bytes.
   * @protected
   */
  setSignature(buffer) {
    this.head = 0;
    this.container = this.readString(buffer, 4);
    if (this.supported_containers.indexOf(this.container) === -1) {
      throw Error('Not a supported format.');
    }
    this.uInt32.be = this.container === 'RIFX';
    this.chunkSize = this.readUInt32(buffer);
    this.format = this.readString(buffer, 4);
    // The RIFF file signature
    this.signature = {
      chunkId: this.container,
      chunkSize: this.chunkSize,
      format: this.format,
      subChunks: this.getSubChunksIndex_(buffer)
    };
  }

  /**
    * Find a chunk by its fourCC_ in a array of RIFF chunks.
    * @param {string} chunkId The chunk fourCC_.
    * @param {boolean} [multiple=false] True if there may be multiple chunks
    *    with the same chunkId.
    * @return {Object}
    * @protected
    */
  findChunk(chunkId, multiple=false) {
    /** @type {!Array<Object>} */
    let chunks = this.signature.subChunks;
    /** @type {!Array<Object>} */
    let chunk = [];
    for (let i=0; i<chunks.length; i++) {
      if (chunks[i].chunkId == chunkId) {
        if (multiple) {
          chunk.push(chunks[i]);
        } else {
          return chunks[i];
        }
      }
    }
    if (chunkId == 'LIST') {
      return chunk.length ? chunk : null;
    }
    return null;
  }

  /**
   * Read bytes as a string from a RIFF chunk.
   * @param {!Uint8Array} bytes The bytes.
   * @param {number} maxSize the max size of the string.
   * @return {string} The string.
   * @protected
   */
  readString(bytes, maxSize) {
    /** @type {string} */
    let str = '';
    str = unpackString(bytes, this.head, this.head + maxSize);
    this.head += maxSize;
    return str;
  }

  /**
   * Read a number from a chunk.
   * @param {!Uint8Array} bytes The chunk bytes.
   * @return {number} The number.
   * @protected
   */
  readUInt32(bytes) {
    /** @type {number} */
    let value = unpack(bytes, this.uInt32, this.head);
    this.head += 4;
    return value;
  }

  /**
   * Return the sub chunks of a RIFF file.
   * @param {!Uint8Array} buffer the RIFF file bytes.
   * @return {!Array<Object>} The subchunks of a RIFF/RIFX or LIST chunk.
   * @private
   */
  getSubChunksIndex_(buffer) {
    /** @type {!Array<!Object>} */
    let chunks = [];
    /** @type {number} */
    let i = this.head;
    while(i <= buffer.length - 8) {
      chunks.push(this.getSubChunkIndex_(buffer, i));
      i += 8 + chunks[chunks.length - 1].chunkSize;
      i = i % 2 ? i + 1 : i;
    }
    return chunks;
  }

  /**
   * Return a sub chunk from a RIFF file.
   * @param {!Uint8Array} buffer the RIFF file bytes.
   * @param {number} index The start index of the chunk.
   * @return {!Object} A subchunk of a RIFF/RIFX or LIST chunk.
   * @private
   */
  getSubChunkIndex_(buffer, index) {
    /** @type {!Object} */
    let chunk = {
      chunkId: this.getChunkId_(buffer, index),
      chunkSize: this.getChunkSize_(buffer, index),
    };
    if (chunk.chunkId == 'LIST') {
      chunk.format = unpackString(buffer, index + 8, index + 12);
      this.head += 4;
      chunk.subChunks = this.getSubChunksIndex_(buffer);
    } else {
      /** @type {number} */
      let realChunkSize = chunk.chunkSize % 2 ?
        chunk.chunkSize + 1 : chunk.chunkSize;
      this.head = index + 8 + realChunkSize;
      chunk.chunkData = {
        start: index + 8,
        end: this.head
      };
    }
    return chunk;
  }

  /**
   * Return the fourCC_ of a chunk.
   * @param {!Uint8Array} buffer the RIFF file bytes.
   * @param {number} index The start index of the chunk.
   * @return {string} The id of the chunk.
   * @private
   */
  getChunkId_(buffer, index) {
    this.head += 4;
    return unpackString(buffer, index, index + 4);
  }

  /**
   * Return the size of a chunk.
   * @param {!Uint8Array} buffer the RIFF file bytes.
   * @param {number} index The start index of the chunk.
   * @return {number} The size of the chunk without the id and size fields.
   * @private
   */
  getChunkSize_(buffer, index) {
    this.head += 4;
    return unpack(buffer, this.uInt32, index + 4);
  }
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to read wav files.
 * @extends RIFFFile
 */
class WaveFileReader extends RIFFFile {

  constructor() {
    super();
    // Include 'RF64' as a supported container format
    this.supported_containers.push('RF64');
    /**
     * The data of the 'fmt' chunk.
     * @type {!Object<string, *>}
     */
    this.fmt = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      audioFormat: 0,
      /** @type {number} */
      numChannels: 0,
      /** @type {number} */
      sampleRate: 0,
      /** @type {number} */
      byteRate: 0,
      /** @type {number} */
      blockAlign: 0,
      /** @type {number} */
      bitsPerSample: 0,
      /** @type {number} */
      cbSize: 0,
      /** @type {number} */
      validBitsPerSample: 0,
      /** @type {number} */
      dwChannelMask: 0,
      /**
       * 4 32-bit values representing a 128-bit ID
       * @type {!Array<number>}
       */
      subformat: []
    };
    /**
     * The data of the 'fact' chunk.
     * @type {!Object<string, *>}
     */
    this.fact = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      dwSampleLength: 0
    };
    /**
     * The data of the 'cue ' chunk.
     * @type {!Object<string, *>}
     */
    this.cue = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      dwCuePoints: 0,
      /** @type {!Array<!Object>} */
      points: [],
    };
    /**
     * The data of the 'smpl' chunk.
     * @type {!Object<string, *>}
     */
    this.smpl = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      dwManufacturer: 0,
      /** @type {number} */
      dwProduct: 0,
      /** @type {number} */
      dwSamplePeriod: 0,
      /** @type {number} */
      dwMIDIUnityNote: 0,
      /** @type {number} */
      dwMIDIPitchFraction: 0,
      /** @type {number} */
      dwSMPTEFormat: 0,
      /** @type {number} */
      dwSMPTEOffset: 0,
      /** @type {number} */
      dwNumSampleLoops: 0,
      /** @type {number} */
      dwSamplerData: 0,
      /** @type {!Array<!Object>} */
      loops: []
    };
    /**
     * The data of the 'bext' chunk.
     * @type {!Object<string, *>}
     */
    this.bext = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {string} */
      description: '', //256
      /** @type {string} */
      originator: '', //32
      /** @type {string} */
      originatorReference: '', //32
      /** @type {string} */
      originationDate: '', //10
      /** @type {string} */
      originationTime: '', //8
      /**
       * 2 32-bit values, timeReference high and low
       * @type {!Array<number>}
       */
      timeReference: [0, 0],
      /** @type {number} */
      version: 0, //WORD
      /** @type {string} */
      UMID: '', // 64 chars
      /** @type {number} */
      loudnessValue: 0, //WORD
      /** @type {number} */
      loudnessRange: 0, //WORD
      /** @type {number} */
      maxTruePeakLevel: 0, //WORD
      /** @type {number} */
      maxMomentaryLoudness: 0, //WORD
      /** @type {number} */
      maxShortTermLoudness: 0, //WORD
      /** @type {string} */
      reserved: '', //180
      /** @type {string} */
      codingHistory: '' // string, unlimited
    };
    /**
     * The data of the 'iXML' chunk.
     * @type {!Object<string, *>}
     */
    this.iXML = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {string} */
      value: ''
    };
    /**
     * The data of the 'ds64' chunk.
     * Used only with RF64 files.
     * @type {!Object<string, *>}
     */
    this.ds64 = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      riffSizeHigh: 0, // DWORD
      /** @type {number} */
      riffSizeLow: 0, // DWORD
      /** @type {number} */
      dataSizeHigh: 0, // DWORD
      /** @type {number} */
      dataSizeLow: 0, // DWORD
      /** @type {number} */
      originationTime: 0, // DWORD
      /** @type {number} */
      sampleCountHigh: 0, // DWORD
      /** @type {number} */
      sampleCountLow: 0 // DWORD
      /** @type {number} */
      //'tableLength': 0, // DWORD
      /** @type {!Array<number>} */
      //'table': []
    };
    /**
     * The data of the 'data' chunk.
     * @type {!Object<string, *>}
     */
    this.data = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {!Uint8Array} */
      samples: new Uint8Array(0)
    };
    /**
     * The data of the 'LIST' chunks.
     * Each item in this list look like this:
     *  {
     *      chunkId: '',
     *      chunkSize: 0,
     *      format: '',
     *      subChunks: []
     *   }
     * @type {!Array<!Object>}
     */
    this.LIST = [];
    /**
     * The data of the 'junk' chunk.
     * @type {!Object<string, *>}
     */
    this.junk = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {!Array<number>} */
      chunkData: []
    };
    /**
     * The data of the '_PMX' chunk.
     * @type {!Object<string, *>}
     */
    this._PMX = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {string} */
      value: ''
    };
    /**
     * @type {{be: boolean, bits: number, fp: boolean, signed: boolean}}
     * @protected
     */
    this.uInt16 = {bits: 16, be: false, signed: false, fp: false};
  }

  /**
   * Set up the WaveFileReader object from a byte buffer.
   * @param {!Uint8Array} wavBuffer The buffer.
   * @param {boolean=} [samples=true] True if the samples should be loaded.
   * @throws {Error} If container is not RIFF, RIFX or RF64.
   * @throws {Error} If format is not WAVE.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @throws {Error} If no 'data' chunk is found.
   */
  fromBuffer(wavBuffer, samples=true) {
    // Always should reset the chunks when reading from a buffer
    this.clearHeaders();
    this.setSignature(wavBuffer);
    this.uInt16.be = this.uInt32.be;
    if (this.format != 'WAVE') {
      throw Error('Could not find the "WAVE" format identifier');
    }
    this.readDs64Chunk_(wavBuffer);
    this.readFmtChunk_(wavBuffer);
    this.readFactChunk_(wavBuffer);
    this.readBextChunk_(wavBuffer);
    this.readiXMLChunk_(wavBuffer);
    this.readCueChunk_(wavBuffer);
    this.readSmplChunk_(wavBuffer);
    this.readDataChunk_(wavBuffer, samples);
    this.readJunkChunk_(wavBuffer);
    this.readLISTChunk_(wavBuffer);
    this.read_PMXChunk_(wavBuffer);
  }

  /**
   * Reset the chunks of the WaveFileReader instance.
   * @protected
   * @ignore
   */
  clearHeaders() {
    /** @type {!Object} */
    let tmpWav = new WaveFileReader();
    Object.assign(this.fmt, tmpWav.fmt);
    Object.assign(this.fact, tmpWav.fact);
    Object.assign(this.cue, tmpWav.cue);
    Object.assign(this.smpl, tmpWav.smpl);
    Object.assign(this.bext, tmpWav.bext);
    Object.assign(this.iXML, tmpWav.iXML);
    Object.assign(this.ds64, tmpWav.ds64);
    Object.assign(this.data, tmpWav.data);
    this.LIST = [];
    Object.assign(this.junk, tmpWav.junk);
    Object.assign(this._PMX, tmpWav._PMX);
  }
  
  /**
   * Read the 'fmt ' chunk of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @private
   */
  readFmtChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('fmt ');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.fmt.chunkId = chunk.chunkId;
      this.fmt.chunkSize = chunk.chunkSize;
      this.fmt.audioFormat = this.readUInt16_(buffer);
      this.fmt.numChannels = this.readUInt16_(buffer);
      this.fmt.sampleRate = this.readUInt32(buffer);
      this.fmt.byteRate = this.readUInt32(buffer);
      this.fmt.blockAlign = this.readUInt16_(buffer);
      this.fmt.bitsPerSample = this.readUInt16_(buffer);
      this.readFmtExtension_(buffer);
    } else {
      throw Error('Could not find the "fmt " chunk');
    }
  }

  /**
   * Read the 'fmt ' chunk extension.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readFmtExtension_(buffer) {
    if (this.fmt.chunkSize > 16) {
      this.fmt.cbSize = this.readUInt16_(buffer);
      if (this.fmt.chunkSize > 18) {
        this.fmt.validBitsPerSample = this.readUInt16_(buffer);
        if (this.fmt.chunkSize > 20) {
          this.fmt.dwChannelMask = this.readUInt32(buffer);
          this.fmt.subformat = [
            this.readUInt32(buffer),
            this.readUInt32(buffer),
            this.readUInt32(buffer),
            this.readUInt32(buffer)];
        }
      }
    }
  }

  /**
   * Read the 'fact' chunk of a wav file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readFactChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('fact');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.fact.chunkId = chunk.chunkId;
      this.fact.chunkSize = chunk.chunkSize;
      this.fact.dwSampleLength = this.readUInt32(buffer);
    }
  }

  /**
   * Read the 'cue ' chunk of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readCueChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('cue ');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.cue.chunkId = chunk.chunkId;
      this.cue.chunkSize = chunk.chunkSize;
      this.cue.dwCuePoints = this.readUInt32(buffer);
      for (let i = 0; i < this.cue.dwCuePoints; i++) {
        this.cue.points.push({
          dwName: this.readUInt32(buffer),
          dwPosition: this.readUInt32(buffer),
          fccChunk: this.readString(buffer, 4),
          dwChunkStart: this.readUInt32(buffer),
          dwBlockStart: this.readUInt32(buffer),
          dwSampleOffset: this.readUInt32(buffer),
        });
      }
    }
  }

  /**
   * Read the 'smpl' chunk of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readSmplChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('smpl');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.smpl.chunkId = chunk.chunkId;
      this.smpl.chunkSize = chunk.chunkSize;
      this.smpl.dwManufacturer = this.readUInt32(buffer);
      this.smpl.dwProduct = this.readUInt32(buffer);
      this.smpl.dwSamplePeriod = this.readUInt32(buffer);
      this.smpl.dwMIDIUnityNote = this.readUInt32(buffer);
      this.smpl.dwMIDIPitchFraction = this.readUInt32(buffer);
      this.smpl.dwSMPTEFormat = this.readUInt32(buffer);
      this.smpl.dwSMPTEOffset = this.readUInt32(buffer);
      this.smpl.dwNumSampleLoops = this.readUInt32(buffer);
      this.smpl.dwSamplerData = this.readUInt32(buffer);
      for (let i = 0; i < this.smpl.dwNumSampleLoops; i++) {
        this.smpl.loops.push({
          dwName: this.readUInt32(buffer),
          dwType: this.readUInt32(buffer),
          dwStart: this.readUInt32(buffer),
          dwEnd: this.readUInt32(buffer),
          dwFraction: this.readUInt32(buffer),
          dwPlayCount: this.readUInt32(buffer),
        });
      }
    }
  }

  /**
   * Read the 'data' chunk of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @param {boolean} samples True if the samples should be loaded.
   * @throws {Error} If no 'data' chunk is found.
   * @private
   */
  readDataChunk_(buffer, samples) {
    /** @type {?Object} */
    let chunk = this.findChunk('data');
    if (chunk) {
      this.data.chunkId = 'data';
      this.data.chunkSize = chunk.chunkSize;
      if (samples) {
        this.data.samples = buffer.slice(
          chunk.chunkData.start,
          chunk.chunkData.end);
      }
    } else {
      throw Error('Could not find the "data" chunk');
    }
  }

  /**
   * Read the 'bext' chunk of a wav file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readBextChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('bext');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.bext.chunkId = chunk.chunkId;
      this.bext.chunkSize = chunk.chunkSize;
      this.bext.description = this.readString(buffer, 256);
      this.bext.originator = this.readString(buffer, 32);
      this.bext.originatorReference = this.readString(buffer, 32);
      this.bext.originationDate = this.readString(buffer, 10);
      this.bext.originationTime = this.readString(buffer, 8);
      this.bext.timeReference = [
        this.readUInt32(buffer),
        this.readUInt32(buffer)];
      this.bext.version = this.readUInt16_(buffer);
      this.bext.UMID = this.readString(buffer, 64);
      this.bext.loudnessValue = this.readUInt16_(buffer);
      this.bext.loudnessRange = this.readUInt16_(buffer);
      this.bext.maxTruePeakLevel = this.readUInt16_(buffer);
      this.bext.maxMomentaryLoudness = this.readUInt16_(buffer);
      this.bext.maxShortTermLoudness = this.readUInt16_(buffer);
      this.bext.reserved = this.readString(buffer, 180);
      this.bext.codingHistory = this.readString(
        buffer, this.bext.chunkSize - 602);
    }
  }

  /**
   * Read the 'iXML' chunk of a wav file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readiXMLChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('iXML');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.iXML.chunkId = chunk.chunkId;
      this.iXML.chunkSize = chunk.chunkSize;
      this.iXML.value = unpackString(
        buffer, this.head, this.head + this.iXML.chunkSize);
    }
  }

  /**
   * Read the 'ds64' chunk of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @throws {Error} If no 'ds64' chunk is found and the file is RF64.
   * @private
   */
  readDs64Chunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('ds64');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this.ds64.chunkId = chunk.chunkId;
      this.ds64.chunkSize = chunk.chunkSize;
      this.ds64.riffSizeHigh = this.readUInt32(buffer);
      this.ds64.riffSizeLow = this.readUInt32(buffer);
      this.ds64.dataSizeHigh = this.readUInt32(buffer);
      this.ds64.dataSizeLow = this.readUInt32(buffer);
      this.ds64.originationTime = this.readUInt32(buffer);
      this.ds64.sampleCountHigh = this.readUInt32(buffer);
      this.ds64.sampleCountLow = this.readUInt32(buffer);
      //if (wav.ds64.chunkSize > 28) {
      //  wav.ds64.tableLength = unpack(
      //    chunkData.slice(28, 32), uInt32_);
      //  wav.ds64.table = chunkData.slice(
      //     32, 32 + wav.ds64.tableLength);
      //}
    } else {
      if (this.container == 'RF64') {
        throw Error('Could not find the "ds64" chunk');
      }
    }
  }

  /**
   * Read the 'LIST' chunks of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readLISTChunk_(buffer) {
    /** @type {?Object} */
    let listChunks = this.findChunk('LIST', true);
    if (listChunks !== null) {
      for (let j=0; j < listChunks.length; j++) {
        /** @type {!Object} */
        let subChunk = listChunks[j];
        this.LIST.push({
          chunkId: subChunk.chunkId,
          chunkSize: subChunk.chunkSize,
          format: subChunk.format,
          subChunks: []});
        for (let x=0; x<subChunk.subChunks.length; x++) {
          this.readLISTSubChunks_(subChunk.subChunks[x],
            subChunk.format, buffer);
        }
      }
    }
  }

  /**
   * Read the sub chunks of a 'LIST' chunk.
   * @param {!Object} subChunk The 'LIST' subchunks.
   * @param {string} format The 'LIST' format, 'adtl' or 'INFO'.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readLISTSubChunks_(subChunk, format, buffer) {
    if (format == 'adtl') {
      if (['labl', 'note','ltxt'].indexOf(subChunk.chunkId) > -1) {
        this.readLISTadtlSubChunks_(buffer, subChunk);
      }
    // RIFF INFO tags like ICRD, ISFT, ICMT
    } else if(format == 'INFO') {
      this.readLISTINFOSubChunks_(buffer, subChunk);
    }
  }

  /**
   * Read the sub chunks of a 'LIST' chunk of type 'adtl'.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @param {!Object} subChunk The 'LIST' subchunks.
   * @private
   */
  readLISTadtlSubChunks_(buffer, subChunk) {
    this.head = subChunk.chunkData.start;
    /** @type {!Object<string, string|number>} */
    let item = {
      chunkId: subChunk.chunkId,
      chunkSize: subChunk.chunkSize,
      dwName: this.readUInt32(buffer)
    };
    if (subChunk.chunkId == 'ltxt') {
      item.dwSampleLength = this.readUInt32(buffer);
      item.dwPurposeID = this.readUInt32(buffer);
      item.dwCountry = this.readUInt16_(buffer);
      item.dwLanguage = this.readUInt16_(buffer);
      item.dwDialect = this.readUInt16_(buffer);
      item.dwCodePage = this.readUInt16_(buffer);
      item.value = ''; // kept for compatibility
    } else {
      item.value = this.readZSTR_(buffer, this.head);
    }
    this.LIST[this.LIST.length - 1].subChunks.push(item);
  }

  /**
   * Read the sub chunks of a 'LIST' chunk of type 'INFO'.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @param {!Object} subChunk The 'LIST' subchunks.
   * @private
   */
  readLISTINFOSubChunks_(buffer, subChunk) {
    this.head = subChunk.chunkData.start;
    this.LIST[this.LIST.length - 1].subChunks.push({
      chunkId: subChunk.chunkId,
      chunkSize: subChunk.chunkSize,
      value: this.readZSTR_(buffer, this.head)
    });
  }

  /**
   * Read the 'junk' chunk of a wave file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  readJunkChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('junk');
    if (chunk) {
      this.junk = {
        chunkId: chunk.chunkId,
        chunkSize: chunk.chunkSize,
        chunkData: [].slice.call(buffer.slice(
          chunk.chunkData.start,
          chunk.chunkData.end))
      };
    }
  }

  /**
   * Read the '_PMX' chunk of a wav file.
   * @param {!Uint8Array} buffer The wav file buffer.
   * @private
   */
  read_PMXChunk_(buffer) {
    /** @type {?Object} */
    let chunk = this.findChunk('_PMX');
    if (chunk) {
      this.head = chunk.chunkData.start;
      this._PMX.chunkId = chunk.chunkId;
      this._PMX.chunkSize = chunk.chunkSize;
      this._PMX.value = unpackString(
        buffer, this.head, this.head + this._PMX.chunkSize);
    }
  }

  /**
   * Read bytes as a ZSTR string.
   * @param {!Uint8Array} bytes The bytes.
   * @param {number=} [index=0] the index to start reading.
   * @return {string} The string.
   * @private
   */
  readZSTR_(bytes, index=0) {
    for (let i = index; i < bytes.length; i++) {
      this.head++;
      if (bytes[i] === 0) {
        break;
      }
    }
    return unpackString(bytes, index, this.head - 1);
  }

  /**
   * Read a number from a chunk.
   * @param {!Uint8Array} bytes The chunk bytes.
   * @return {number} The number.
   * @private
   */
  readUInt16_(bytes) {
    /** @type {number} */
    let value = unpack(bytes, this.uInt16, this.head);
    this.head += 2;
    return value;
  }
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * Pack a string an array of bytes. If the packed string length is smaller
 * than the desired byte length the output array is filled with 0s.
 * @param {string} str The string to be written as bytes.
 * @param {number} byteLength the size of the string in bytes.
 * @return {!Array<number>} The packed string.
 */
function writeString(str, byteLength) {
  /** @type {!Array<number>} */   
  let packedString = packString(str);
  for (let i = packedString.length; i < byteLength; i++) {
    packedString.push(0);
  }
  return packedString;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to read and write wav files.
 * @extends WaveFileReader
 */
class WaveFileParser extends WaveFileReader {

  /**
   * Return a byte buffer representig the WaveFileParser object as a .wav file.
   * The return value of this method can be written straight to disk.
   * @return {!Uint8Array} A wav file.
   */
  toBuffer() {
    this.uInt16.be = this.container === 'RIFX';
    this.uInt32.be = this.uInt16.be;
    /** @type {!Array<!Array<number>>} */
    let fileBody = [
      this.getJunkBytes_(),
      this.getDs64Bytes_(),
      this.getBextBytes_(),
      this.getiXMLBytes_(),
      this.getFmtBytes_(),
      this.getFactBytes_(),
      packString(this.data.chunkId),
      pack(this.data.samples.length, this.uInt32),
      this.data.samples,
      this.getCueBytes_(),
      this.getSmplBytes_(),
      this.getLISTBytes_(),
      this.get_PMXBytes_()
    ];
    /** @type {number} */
    let fileBodyLength = 0;
    for (let i=0; i<fileBody.length; i++) {
      fileBodyLength += fileBody[i].length;
    }
    /** @type {!Uint8Array} */
    let file = new Uint8Array(fileBodyLength + 12);
    /** @type {number} */
    let index = 0;
    index = packStringTo(this.container, file, index);
    index = packTo(fileBodyLength + 4, this.uInt32, file, index);
    index = packStringTo(this.format, file, index);
    for (let i=0; i<fileBody.length; i++) {
      file.set(fileBody[i], index);
      index += fileBody[i].length;
    }
    return file;
  }

  /**
   * Return the bytes of the 'bext' chunk.
   * @private
   */
  getBextBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    this.enforceBext_();
    if (this.bext.chunkId) {
      this.bext.chunkSize = 602 + this.bext.codingHistory.length;
      bytes = bytes.concat(
        packString(this.bext.chunkId),
        pack(602 + this.bext.codingHistory.length, this.uInt32),
        writeString(this.bext.description, 256),
        writeString(this.bext.originator, 32),
        writeString(this.bext.originatorReference, 32),
        writeString(this.bext.originationDate, 10),
        writeString(this.bext.originationTime, 8),
        pack(this.bext.timeReference[0], this.uInt32),
        pack(this.bext.timeReference[1], this.uInt32),
        pack(this.bext.version, this.uInt16),
        writeString(this.bext.UMID, 64),
        pack(this.bext.loudnessValue, this.uInt16),
        pack(this.bext.loudnessRange, this.uInt16),
        pack(this.bext.maxTruePeakLevel, this.uInt16),
        pack(this.bext.maxMomentaryLoudness, this.uInt16),
        pack(this.bext.maxShortTermLoudness, this.uInt16),
        writeString(this.bext.reserved, 180),
        writeString(
          this.bext.codingHistory, this.bext.codingHistory.length));
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Make sure a 'bext' chunk is created if BWF data was created in a file.
   * @private
   */
  enforceBext_() {
    for (let prop in this.bext) {
      if (this.bext.hasOwnProperty(prop)) {
        if (this.bext[prop] && prop != 'timeReference') {
          this.bext.chunkId = 'bext';
          break;
        }
      }
    }
    if (this.bext.timeReference[0] || this.bext.timeReference[1]) {
      this.bext.chunkId = 'bext';
    }
  }

  /**
   * Return the bytes of the 'iXML' chunk.
   * @return {!Array<number>} The 'iXML' chunk bytes.
   * @private
   */
  getiXMLBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this.iXML.chunkId) {
      /** @type {!Array<number>} */
      let iXMLPackedValue = packString(this.iXML.value);
      this.iXML.chunkSize = iXMLPackedValue.length;
      bytes = bytes.concat(
        packString(this.iXML.chunkId),
        pack(this.iXML.chunkSize, this.uInt32),
        iXMLPackedValue);
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the 'ds64' chunk.
   * @return {!Array<number>} The 'ds64' chunk bytes.
   * @private
   */
  getDs64Bytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this.ds64.chunkId) {
      bytes = bytes.concat(
        packString(this.ds64.chunkId),
        pack(this.ds64.chunkSize, this.uInt32),
        pack(this.ds64.riffSizeHigh, this.uInt32),
        pack(this.ds64.riffSizeLow, this.uInt32),
        pack(this.ds64.dataSizeHigh, this.uInt32),
        pack(this.ds64.dataSizeLow, this.uInt32),
        pack(this.ds64.originationTime, this.uInt32),
        pack(this.ds64.sampleCountHigh, this.uInt32),
        pack(this.ds64.sampleCountLow, this.uInt32));
    }
    //if (this.ds64.tableLength) {
    //  ds64Bytes = ds64Bytes.concat(
    //    pack(this.ds64.tableLength, this.uInt32),
    //    this.ds64.table);
    //}
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the 'cue ' chunk.
   * @return {!Array<number>} The 'cue ' chunk bytes.
   * @private
   */
  getCueBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this.cue.chunkId) {
      /** @type {!Array<number>} */
      let cuePointsBytes = this.getCuePointsBytes_();
      bytes = bytes.concat(
        packString(this.cue.chunkId),
        pack(cuePointsBytes.length + 4, this.uInt32), // chunkSize
        pack(this.cue.dwCuePoints, this.uInt32),
        cuePointsBytes);
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the 'cue ' points.
   * @return {!Array<number>} The 'cue ' points as an array of bytes.
   * @private
   */
  getCuePointsBytes_() {
    /** @type {!Array<number>} */
    let points = [];
    for (let i=0; i<this.cue.dwCuePoints; i++) {
      points = points.concat(
        pack(this.cue.points[i].dwName, this.uInt32),
        pack(this.cue.points[i].dwPosition, this.uInt32),
        packString(this.cue.points[i].fccChunk),
        pack(this.cue.points[i].dwChunkStart, this.uInt32),
        pack(this.cue.points[i].dwBlockStart, this.uInt32),
        pack(this.cue.points[i].dwSampleOffset, this.uInt32));
    }
    return points;
  }

  /**
   * Return the bytes of the 'smpl' chunk.
   * @return {!Array<number>} The 'smpl' chunk bytes.
   * @private
   */
  getSmplBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this.smpl.chunkId) {
      /** @type {!Array<number>} */
      let smplLoopsBytes = this.getSmplLoopsBytes_();
      bytes = bytes.concat(
        packString(this.smpl.chunkId),
        pack(smplLoopsBytes.length + 36, this.uInt32), //chunkSize
        pack(this.smpl.dwManufacturer, this.uInt32),
        pack(this.smpl.dwProduct, this.uInt32),
        pack(this.smpl.dwSamplePeriod, this.uInt32),
        pack(this.smpl.dwMIDIUnityNote, this.uInt32),
        pack(this.smpl.dwMIDIPitchFraction, this.uInt32),
        pack(this.smpl.dwSMPTEFormat, this.uInt32),
        pack(this.smpl.dwSMPTEOffset, this.uInt32),
        pack(this.smpl.dwNumSampleLoops, this.uInt32),
        pack(this.smpl.dwSamplerData, this.uInt32),
        smplLoopsBytes);
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the 'smpl' loops.
   * @return {!Array<number>} The 'smpl' loops as an array of bytes.
   * @private
   */
  getSmplLoopsBytes_() {
    /** @type {!Array<number>} */
    let loops = [];
    for (let i=0; i<this.smpl.dwNumSampleLoops; i++) {
      loops = loops.concat(
        pack(this.smpl.loops[i].dwName, this.uInt32),
        pack(this.smpl.loops[i].dwType, this.uInt32),
        pack(this.smpl.loops[i].dwStart, this.uInt32),
        pack(this.smpl.loops[i].dwEnd, this.uInt32),
        pack(this.smpl.loops[i].dwFraction, this.uInt32),
        pack(this.smpl.loops[i].dwPlayCount, this.uInt32));
    }
    return loops;
  }

  /**
   * Return the bytes of the 'fact' chunk.
   * @return {!Array<number>} The 'fact' chunk bytes.
   * @private
   */
  getFactBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this.fact.chunkId) {
      bytes = bytes.concat(
        packString(this.fact.chunkId),
        pack(this.fact.chunkSize, this.uInt32),
        pack(this.fact.dwSampleLength, this.uInt32));
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the 'fmt ' chunk.
   * @return {!Array<number>} The 'fmt' chunk bytes.
   * @throws {Error} if no 'fmt ' chunk is present.
   * @private
   */
  getFmtBytes_() {
    /** @type {!Array<number>} */
    let fmtBytes = [];
    if (this.fmt.chunkId) {
      /** @type {!Array<number>} */
      let bytes  = fmtBytes.concat(
        packString(this.fmt.chunkId),
        pack(this.fmt.chunkSize, this.uInt32),
        pack(this.fmt.audioFormat, this.uInt16),
        pack(this.fmt.numChannels, this.uInt16),
        pack(this.fmt.sampleRate, this.uInt32),
        pack(this.fmt.byteRate, this.uInt32),
        pack(this.fmt.blockAlign, this.uInt16),
        pack(this.fmt.bitsPerSample, this.uInt16),
        this.getFmtExtensionBytes_());
      this.enforceByteLen_(bytes);
      return bytes;
    }
    throw Error('Could not find the "fmt " chunk');
  }

  /**
   * Return the bytes of the fmt extension fields.
   * @return {!Array<number>} The fmt extension bytes.
   * @private
   */
  getFmtExtensionBytes_() {
    /** @type {!Array<number>} */
    let extension = [];
    if (this.fmt.chunkSize > 16) {
      extension = extension.concat(
        pack(this.fmt.cbSize, this.uInt16));
    }
    if (this.fmt.chunkSize > 18) {
      extension = extension.concat(
        pack(this.fmt.validBitsPerSample, this.uInt16));
    }
    if (this.fmt.chunkSize > 20) {
      extension = extension.concat(
        pack(this.fmt.dwChannelMask, this.uInt32));
    }
    if (this.fmt.chunkSize > 24) {
      extension = extension.concat(
        pack(this.fmt.subformat[0], this.uInt32),
        pack(this.fmt.subformat[1], this.uInt32),
        pack(this.fmt.subformat[2], this.uInt32),
        pack(this.fmt.subformat[3], this.uInt32));
    }
    return extension;
  }

  /**
   * Return the bytes of the 'LIST' chunk.
   * @return {!Array<number>} The 'LIST' chunk bytes.
   * @private
   */
  getLISTBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    for (let i=0; i<this.LIST.length; i++) {
      /** @type {!Array<number>} */
      let subChunksBytes = this.getLISTSubChunksBytes_(
          this.LIST[i].subChunks, this.LIST[i].format);
      bytes = bytes.concat(
        packString(this.LIST[i].chunkId),
        pack(subChunksBytes.length + 4, this.uInt32), //chunkSize
        packString(this.LIST[i].format),
        subChunksBytes);
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the sub chunks of a 'LIST' chunk.
   * @param {!Array<!Object>} subChunks The 'LIST' sub chunks.
   * @param {string} format The format of the 'LIST' chunk.
   *    Currently supported values are 'adtl' or 'INFO'.
   * @return {!Array<number>} The sub chunk bytes.
   * @private
   */
  getLISTSubChunksBytes_(subChunks, format) {
    /** @type {!Array<number>} */
    let bytes = [];
    for (let i = 0, len = subChunks.length; i < len; i++) {
      if (format == 'INFO') {
        bytes = bytes.concat(this.getLISTINFOSubChunksBytes_(subChunks[i]));
      } else if (format == 'adtl') {
        bytes = bytes.concat(this.getLISTadtlSubChunksBytes_(subChunks[i]));
      }
      this.enforceByteLen_(bytes);
    }
    return bytes;
  }

  /**
   * Return the bytes of the sub chunks of a 'LIST' chunk of type 'INFO'.
   * @param {!Object} subChunk The 'LIST' sub chunk.
   * @return {!Array<number>}
   * @private
   */
  getLISTINFOSubChunksBytes_(subChunk) {
    /** @type {!Array<number>} */
    let bytes = [];
    /** @type {!Array<number>} */
    let LISTsubChunkValue = writeString(
        subChunk.value, subChunk.value.length);
    bytes = bytes.concat(
      packString(subChunk.chunkId),
      pack(LISTsubChunkValue.length + 1, this.uInt32), //chunkSize
      LISTsubChunkValue);
    bytes.push(0);
    return bytes;
  }

  /**
   * Return the bytes of the sub chunks of a 'LIST' chunk of type 'INFO'.
   * @param {!Object} subChunk The 'LIST' sub chunk.
   * @return {!Array<number>}
   * @private
   */
  getLISTadtlSubChunksBytes_(subChunk) {
    /** @type {!Array<number>} */
    let bytes = [];
    if (['labl', 'note'].indexOf(subChunk.chunkId) > -1) {
      /** @type {!Array<number>} */
      let LISTsubChunkValue = writeString(
          subChunk.value,
          subChunk.value.length);
      bytes = bytes.concat(
        packString(subChunk.chunkId),
        pack(LISTsubChunkValue.length + 4 + 1, this.uInt32), //chunkSize
        pack(subChunk.dwName, this.uInt32),
        LISTsubChunkValue);
      bytes.push(0);
    } else if (subChunk.chunkId == 'ltxt') {
      bytes = bytes.concat(
        this.getLtxtChunkBytes_(subChunk));
    }
    return bytes;
  }

  /**
   * Return the bytes of a 'ltxt' chunk.
   * @param {!Object} ltxt the 'ltxt' chunk.
   * @return {!Array<number>}
   * @private
   */
  getLtxtChunkBytes_(ltxt) {
    return [].concat(
      packString(ltxt.chunkId),
      pack(ltxt.value.length + 20, this.uInt32),
      pack(ltxt.dwName, this.uInt32),
      pack(ltxt.dwSampleLength, this.uInt32),
      pack(ltxt.dwPurposeID, this.uInt32),
      pack(ltxt.dwCountry, this.uInt16),
      pack(ltxt.dwLanguage, this.uInt16),
      pack(ltxt.dwDialect, this.uInt16),
      pack(ltxt.dwCodePage, this.uInt16),
       // should always be a empty string;
       // kept for compatibility
      writeString(ltxt.value, ltxt.value.length));
  }

  /**
   * Return the bytes of the '_PMX' chunk.
   * @return {!Array<number>} The '_PMX' chunk bytes.
   * @private
   */
  get_PMXBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this._PMX.chunkId) {
      /** @type {!Array<number>} */
      let _PMXPackedValue = packString(this._PMX.value);
      this._PMX.chunkSize = _PMXPackedValue.length;
      bytes = bytes.concat(
        packString(this._PMX.chunkId),
        pack(this._PMX.chunkSize, this.uInt32),
        _PMXPackedValue);
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Return the bytes of the 'junk' chunk.
   * @private
   */
  getJunkBytes_() {
    /** @type {!Array<number>} */
    let bytes = [];
    if (this.junk.chunkId) {
      return bytes.concat(
        packString(this.junk.chunkId),
        pack(this.junk.chunkData.length, this.uInt32), //chunkSize
        this.junk.chunkData);
    }
    this.enforceByteLen_(bytes);
    return bytes;
  }

  /**
   * Push a null byte into a byte array if
   * the byte count is odd.
   * @param {!Array<number>} bytes The byte array.
   * @private
   */
  enforceByteLen_(bytes) {
    if (bytes.length % 2) {
      bytes.push(0);
    }
  }
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview The interleave function.
 * @see https://github.com/rochars/wavefile
 */

/**
 * Interleave de-interleaved samples.
 * @param {!(Array|TypedArray)} samples The samples.
 * @return {!(Array|TypedArray)}
 */
function interleave(samples) {
  /** @type {!(Array|TypedArray)} */
  let finalSamples = [];
  if (samples.length > 0) {
    if (samples[0].constructor !== Number) {
      finalSamples = new Float64Array(samples[0].length * samples.length);
      for (let i = 0, len = samples[0].length, x = 0; i < len; i++) {
        for (let j = 0, subLen = samples.length; j < subLen; j++, x++) {
          finalSamples[x] = samples[j][i];
        }
      }
    } else {
      finalSamples = samples;
    }
  }
  return finalSamples;
}

/**
 * De-interleave samples into multiple channels.
 * @param {!(Array|TypedArray)} samples The samples.
 * @param {number} numChannels The number of channels to split the samples.
 * @param {Function} [OutputObject=Float64Array] The type of object to
 *   write the de-interleaved samples.
 * @return {!(Array|TypedArray)}
 */
function deInterleave(samples, numChannels, OutputObject=Float64Array) {
  /** @type {!(Array|TypedArray)} */
  let finalSamples = [];
  for (let i = 0; i < numChannels; i++) {
    finalSamples[i] = new OutputObject(samples.length / numChannels);
  }
  for (let i = 0; i < numChannels; i++) {
    for (let j = i, s = 0; j < samples.length; j+= numChannels, s++) {
      finalSamples[i][s] = samples[j];
    }
  }
  return finalSamples;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview The validateNumChannels function.
 * @see https://github.com/rochars/wavefile
 */

/**
 * Validate the number of channels in a wav file according to the
 * bit depth of the audio.
 * @param {number} channels The number of channels in the file.
 * @param {number} bits The number of bits per sample.
 * @return {boolean} True is the number of channels is valid.
 */
function validateNumChannels(channels, bits) {
  /** @type {number} */
  let blockAlign = channels * bits / 8;
  if (channels < 1 || blockAlign > 65535) {
    return false;
  }
  return true;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview The validateSampleRate function.
 * @see https://github.com/rochars/wavefile
 */

/**
 * Validate the sample rate value of a wav file according to the number of
 * channels and the bit depth of the audio.
 * @param {number} channels The number of channels in the file.
 * @param {number} bits The number of bits per sample.
 * @param {number} sampleRate The sample rate to be validated.
 * @return {boolean} True is the sample rate is valid, false otherwise.
 */
function validateSampleRate(channels, bits, sampleRate) {
  /** @type {number} */
  let byteRate = channels * (bits / 8) * sampleRate;
  if (sampleRate < 1 || byteRate > 4294967295) {
    return false;
  }
  return true;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to read, write and create wav files.
 * @extends WaveFileParser
 * @ignore
 */
class WaveFileCreator extends WaveFileParser {

  constructor() {
    super();
    /**
     * The bit depth code according to the samples.
     * @type {string}
     */
    this.bitDepth = '0';
    /**
     * @type {!{bits: number, be: boolean}}
     * @protected
     */
    this.dataType = {bits: 0, be: false};
    /**
     * Audio formats.
     * Formats not listed here should be set to 65534,
     * the code for WAVE_FORMAT_EXTENSIBLE
     * @enum {number}
     * @protected
     */
    this.WAV_AUDIO_FORMATS = {
      '4': 17,
      '8': 1,
      '8a': 6,
      '8m': 7,
      '16': 1,
      '24': 1,
      '32': 1,
      '32f': 3,
      '64': 3
    };
  }

  /**
   * Set up the WaveFileCreator object based on the arguments passed.
   * Existing chunks are reset.
   * @param {number} numChannels The number of channels.
   * @param {number} sampleRate The sample rate.
   *    Integers like 8000, 44100, 48000, 96000, 192000.
   * @param {string} bitDepthCode The audio bit depth code.
   *    One of '4', '8', '8a', '8m', '16', '24', '32', '32f', '64'
   *    or any value between '8' and '32' (like '12').
   * @param {!(Array|TypedArray)} samples The samples.
   * @param {Object=} options Optional. Used to force the container
   *    as RIFX with {'container': 'RIFX'}
   * @throws {Error} If any argument does not meet the criteria.
   */
  fromScratch(numChannels, sampleRate, bitDepthCode, samples, options) {
    options = options || {};
    // reset all chunks
    this.clearHeaders();
    this.newWavFile_(numChannels, sampleRate, bitDepthCode, samples, options);
  }

  /**
   * Set up the WaveFileParser object from a byte buffer.
   * @param {!Uint8Array} wavBuffer The buffer.
   * @param {boolean=} [samples=true] True if the samples should be loaded.
   * @throws {Error} If container is not RIFF, RIFX or RF64.
   * @throws {Error} If format is not WAVE.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @throws {Error} If no 'data' chunk is found.
   */
  fromBuffer(wavBuffer, samples=true) {
    super.fromBuffer(wavBuffer, samples);
    this.bitDepthFromFmt_();
    this.updateDataType_();
  }

  /**
   * Return a byte buffer representig the WaveFileParser object as a .wav file.
   * The return value of this method can be written straight to disk.
   * @return {!Uint8Array} A wav file.
   * @throws {Error} If bit depth is invalid.
   * @throws {Error} If the number of channels is invalid.
   * @throws {Error} If the sample rate is invalid.
   */
  toBuffer() {
    this.validateWavHeader_();
    return super.toBuffer();
  }

  /**
   * Return the samples packed in a Float64Array.
   * @param {boolean=} [interleaved=false] True to return interleaved samples,
   *   false to return the samples de-interleaved.
   * @param {Function=} [OutputObject=Float64Array] The sample container.
   * @return {!(Array|TypedArray)} the samples.
   */
  getSamples(interleaved=false, OutputObject=Float64Array) {
    /**
     * A Float64Array created with a size to match the
     * the length of the samples.
     * @type {!(Array|TypedArray)}
     */
    let samples = new OutputObject(
      this.data.samples.length / (this.dataType.bits / 8));
    // Unpack all the samples
    unpackArrayTo(this.data.samples, this.dataType, samples,
      0, this.data.samples.length);
    if (!interleaved && this.fmt.numChannels > 1) {
      return deInterleave(samples, this.fmt.numChannels, OutputObject);
    }
    return samples;
  }

  /**
   * Return the sample at a given index.
   * @param {number} index The sample index.
   * @return {number} The sample.
   * @throws {Error} If the sample index is off range.
   */
  getSample(index) {
    index = index * (this.dataType.bits / 8);
    if (index + this.dataType.bits / 8 > this.data.samples.length) {
      throw new Error('Range error');
    }
    return unpack(
      this.data.samples.slice(index, index + this.dataType.bits / 8),
      this.dataType);
  }

  /**
   * Set the sample at a given index.
   * @param {number} index The sample index.
   * @param {number} sample The sample.
   * @throws {Error} If the sample index is off range.
   */
  setSample(index, sample) {
    index = index * (this.dataType.bits / 8);
    if (index + this.dataType.bits / 8 > this.data.samples.length) {
      throw new Error('Range error');
    }
    packTo(sample, this.dataType, this.data.samples, index);
  }

  /**
   * Return the value of the iXML chunk.
   * @return {string} The contents of the iXML chunk.
   */
  getiXML() {
    return this.iXML.value;
  }

  /**
   * Set the value of the iXML chunk.
   * @param {string} iXMLValue The value for the iXML chunk.
   * @throws {TypeError} If the value is not a string.
   */
  setiXML(iXMLValue) {
    if (typeof iXMLValue !== 'string') {
      throw new TypeError('iXML value must be a string.');
    }
    this.iXML.value = iXMLValue;
    this.iXML.chunkId = 'iXML';
  }

  /**
   * Get the value of the _PMX chunk.
   * @return {string} The contents of the _PMX chunk.
   */
  get_PMX() {
    return this._PMX.value;
  }

  /**
   * Set the value of the _PMX chunk.
   * @param {string} _PMXValue The value for the _PMX chunk.
   * @throws {TypeError} If the value is not a string.
   */
  set_PMX(_PMXValue) {
    if (typeof _PMXValue !== 'string') {
      throw new TypeError('_PMX value must be a string.');
    }
    this._PMX.value = _PMXValue;
    this._PMX.chunkId = '_PMX';
  }

  /**
   * Set up the WaveFileCreator object based on the arguments passed.
   * @param {number} numChannels The number of channels.
   * @param {number} sampleRate The sample rate.
   *   Integers like 8000, 44100, 48000, 96000, 192000.
   * @param {string} bitDepthCode The audio bit depth code.
   *   One of '4', '8', '8a', '8m', '16', '24', '32', '32f', '64'
   *   or any value between '8' and '32' (like '12').
   * @param {!(Array|TypedArray)} samples The samples.
   * @param {Object} options Used to define the container.
   * @throws {Error} If any argument does not meet the criteria.
   * @private
   */
  newWavFile_(numChannels, sampleRate, bitDepthCode, samples, options) {
    if (!options.container) {
      options.container = 'RIFF';
    }
    this.container = options.container;
    this.bitDepth = bitDepthCode;
    samples = interleave(samples);
    this.updateDataType_();
    /** @type {number} */
    let numBytes = this.dataType.bits / 8;
    this.data.samples = new Uint8Array(samples.length * numBytes);
    packArrayTo(samples, this.dataType, this.data.samples, 0);
    this.makeWavHeader_(
      bitDepthCode, numChannels, sampleRate,
      numBytes, this.data.samples.length, options);
    this.data.chunkId = 'data';
    this.data.chunkSize = this.data.samples.length;
    this.validateWavHeader_();
  }

  /**
   * Define the header of a wav file.
   * @param {string} bitDepthCode The audio bit depth
   * @param {number} numChannels The number of channels
   * @param {number} sampleRate The sample rate.
   * @param {number} numBytes The number of bytes each sample use.
   * @param {number} samplesLength The length of the samples in bytes.
   * @param {!Object} options The extra options, like container defintion.
   * @private
   */
  makeWavHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
    if (bitDepthCode == '4') {
      this.createADPCMHeader_(
        bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);

    } else if (bitDepthCode == '8a' || bitDepthCode == '8m') {
      this.createALawMulawHeader_(
        bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);

    } else if(Object.keys(this.WAV_AUDIO_FORMATS).indexOf(bitDepthCode) == -1 ||
        numChannels > 2) {
      this.createExtensibleHeader_(
        bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);

    } else {
      this.createPCMHeader_(
        bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);      
    }
  }

  /**
   * Create the header of a linear PCM wave file.
   * @param {string} bitDepthCode The audio bit depth
   * @param {number} numChannels The number of channels
   * @param {number} sampleRate The sample rate.
   * @param {number} numBytes The number of bytes each sample use.
   * @param {number} samplesLength The length of the samples in bytes.
   * @param {!Object} options The extra options, like container defintion.
   * @private
   */
  createPCMHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
    this.container = options.container;
    this.chunkSize = 36 + samplesLength;
    this.format = 'WAVE';
    this.bitDepth = bitDepthCode;
    this.fmt = {
      chunkId: 'fmt ',
      chunkSize: 16,
      audioFormat: this.WAV_AUDIO_FORMATS[bitDepthCode] || 65534,
      numChannels: numChannels,
      sampleRate: sampleRate,
      byteRate: (numChannels * numBytes) * sampleRate,
      blockAlign: numChannels * numBytes,
      bitsPerSample: parseInt(bitDepthCode, 10),
      cbSize: 0,
      validBitsPerSample: 0,
      dwChannelMask: 0,
      subformat: []
    };
  }

  /**
   * Create the header of a ADPCM wave file.
   * @param {string} bitDepthCode The audio bit depth
   * @param {number} numChannels The number of channels
   * @param {number} sampleRate The sample rate.
   * @param {number} numBytes The number of bytes each sample use.
   * @param {number} samplesLength The length of the samples in bytes.
   * @param {!Object} options The extra options, like container defintion.
   * @private
   */
  createADPCMHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
    this.createPCMHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);
    this.chunkSize = 40 + samplesLength;
    this.fmt.chunkSize = 20;
    this.fmt.byteRate = 4055;
    this.fmt.blockAlign = 256;
    this.fmt.bitsPerSample = 4;
    this.fmt.cbSize = 2;
    this.fmt.validBitsPerSample = 505;
    this.fact = {
      chunkId: 'fact',
      chunkSize: 4,
      dwSampleLength: samplesLength * 2
    };
  }

  /**
   * Create the header of WAVE_FORMAT_EXTENSIBLE file.
   * @param {string} bitDepthCode The audio bit depth
   * @param {number} numChannels The number of channels
   * @param {number} sampleRate The sample rate.
   * @param {number} numBytes The number of bytes each sample use.
   * @param {number} samplesLength The length of the samples in bytes.
   * @param {!Object} options The extra options, like container defintion.
   * @private
   */
  createExtensibleHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
    this.createPCMHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);
    this.chunkSize = 36 + 24 + samplesLength;
    this.fmt.chunkSize = 40;
    this.fmt.bitsPerSample = ((parseInt(bitDepthCode, 10) - 1) | 7) + 1;
    this.fmt.cbSize = 22;
    this.fmt.validBitsPerSample = parseInt(bitDepthCode, 10);
    this.fmt.dwChannelMask = dwChannelMask_(numChannels);
    // subformat 128-bit GUID as 4 32-bit values
    // only supports uncompressed integer PCM samples
    this.fmt.subformat = [1, 1048576, 2852126848, 1905997824];
  }

  /**
   * Create the header of mu-Law and A-Law wave files.
   * @param {string} bitDepthCode The audio bit depth
   * @param {number} numChannels The number of channels
   * @param {number} sampleRate The sample rate.
   * @param {number} numBytes The number of bytes each sample use.
   * @param {number} samplesLength The length of the samples in bytes.
   * @param {!Object} options The extra options, like container defintion.
   * @private
   */
  createALawMulawHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
    this.createPCMHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);
    this.chunkSize = 40 + samplesLength;
    this.fmt.chunkSize = 20;
    this.fmt.cbSize = 2;
    this.fmt.validBitsPerSample = 8;
    this.fact = {
      chunkId: 'fact',
      chunkSize: 4,
      dwSampleLength: samplesLength
    };
  }

  /**
   * Set the string code of the bit depth based on the 'fmt ' chunk.
   * @private
   */
  bitDepthFromFmt_() {
    if (this.fmt.audioFormat === 3 && this.fmt.bitsPerSample === 32) {
      this.bitDepth = '32f';
    } else if (this.fmt.audioFormat === 6) {
      this.bitDepth = '8a';
    } else if (this.fmt.audioFormat === 7) {
      this.bitDepth = '8m';
    } else {
      this.bitDepth = this.fmt.bitsPerSample.toString();
    }
  }

  /**
   * Validate the bit depth.
   * @return {boolean} True is the bit depth is valid.
   * @throws {Error} If bit depth is invalid.
   * @private
   */
  validateBitDepth_() {
    if (!this.WAV_AUDIO_FORMATS[this.bitDepth]) {
      if (parseInt(this.bitDepth, 10) > 8 &&
          parseInt(this.bitDepth, 10) < 54) {
        return true;
      }
      throw new Error('Invalid bit depth.');
    }
    return true;
  }

  /**
   * Update the type definition used to read and write the samples.
   * @private
   */
  updateDataType_() {
    this.dataType = {
      bits: ((parseInt(this.bitDepth, 10) - 1) | 7) + 1,
      fp: this.bitDepth == '32f' || this.bitDepth == '64',
      signed: this.bitDepth != '8',
      be: this.container == 'RIFX'
    };
    if (['4', '8a', '8m'].indexOf(this.bitDepth) > -1 ) {
      this.dataType.bits = 8;
      this.dataType.signed = false;
    }
  }

  /**
   * Validate the header of the file.
   * @throws {Error} If bit depth is invalid.
   * @throws {Error} If the number of channels is invalid.
   * @throws {Error} If the sample rate is invalid.
   * @ignore
   * @private
   */
  validateWavHeader_() {
    this.validateBitDepth_();
    if (!validateNumChannels(this.fmt.numChannels, this.fmt.bitsPerSample)) {
      throw new Error('Invalid number of channels.');
    }
    if (!validateSampleRate(
        this.fmt.numChannels, this.fmt.bitsPerSample, this.fmt.sampleRate)) {
      throw new Error('Invalid sample rate.');
    }
  }
}

/**
 * Return the value for dwChannelMask according to the number of channels.
 * @param {number} numChannels the number of channels.
 * @return {number} the dwChannelMask value.
 * @private
 */
function dwChannelMask_(numChannels) {
  /** @type {number} */
  let mask = 0;
  // mono = FC
  if (numChannels === 1) {
    mask = 0x4;
  // stereo = FL, FR
  } else if (numChannels === 2) {
    mask = 0x3;
  // quad = FL, FR, BL, BR
  } else if (numChannels === 4) {
    mask = 0x33;
  // 5.1 = FL, FR, FC, LF, BL, BR
  } else if (numChannels === 6) {
    mask = 0x3F;
  // 7.1 = FL, FR, FC, LF, BL, BR, SL, SR
  } else if (numChannels === 8) {
    mask = 0x63F;
  }
  return mask;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to edit meta information in wav files.
 * @extends WaveFileCreator
 * @ignore
 */
class WaveFileTagEditor extends WaveFileCreator {

  /**
   * Return the value of a RIFF tag in the INFO chunk.
   * @param {string} tag The tag name.
   * @return {?string} The value if the tag is found, null otherwise.
   */
  getTag(tag) {
    /** @type {!Object} */
    let index = this.getTagIndex_(tag);
    if (index.TAG !== null) {
      return this.LIST[index.LIST].subChunks[index.TAG].value;
    }
    return null;
  }

  /**
   * Write a RIFF tag in the INFO chunk. If the tag do not exist,
   * then it is created. It if exists, it is overwritten.
   * @param {string} tag The tag name.
   * @param {string} value The tag value.
   * @throws {Error} If the tag name is not valid.
   */
  setTag(tag, value) {
    tag = fixRIFFTag_(tag);
    /** @type {!Object} */
    let index = this.getTagIndex_(tag);
    if (index.TAG !== null) {
      this.LIST[index.LIST].subChunks[index.TAG].chunkSize =
        value.length + 1;
      this.LIST[index.LIST].subChunks[index.TAG].value = value;
    } else if (index.LIST !== null) {
      this.LIST[index.LIST].subChunks.push({
        chunkId: tag,
        chunkSize: value.length + 1,
        value: value});
    } else {
      this.LIST.push({
        chunkId: 'LIST',
        chunkSize: 8 + value.length + 1,
        format: 'INFO',
        subChunks: []});
      this.LIST[this.LIST.length - 1].subChunks.push({
        chunkId: tag,
        chunkSize: value.length + 1,
        value: value});
    }
  }

  /**
   * Remove a RIFF tag from the INFO chunk.
   * @param {string} tag The tag name.
   * @return {boolean} True if a tag was deleted.
   */
  deleteTag(tag) {
    /** @type {!Object} */
    let index = this.getTagIndex_(tag);
    if (index.TAG !== null) {
      this.LIST[index.LIST].subChunks.splice(index.TAG, 1);
      return true;
    }
    return false;
  }

  /**
   * Return a Object<tag, value> with the RIFF tags in the file.
   * @return {!Object<string, string>} The file tags.
   */
  listTags() {
    /** @type {?number} */
    let index = this.getLISTIndex('INFO');
    /** @type {!Object} */
    let tags = {};
    if (index !== null) {
      for (let i = 0, len = this.LIST[index].subChunks.length; i < len; i++) {
        tags[this.LIST[index].subChunks[i].chunkId] =
          this.LIST[index].subChunks[i].value;
      }
    }
    return tags;
  }

  /**
   * Return the index of a list by its type.
   * @param {string} listType The list type ('adtl', 'INFO')
   * @return {?number}
   * @protected
   */
  getLISTIndex(listType) {
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format == listType) {
        return i;
      }
    }
    return null;
  }

  /**
   * Return the index of a tag in a FILE chunk.
   * @param {string} tag The tag name.
   * @return {!Object<string, ?number>}
   *    Object.LIST is the INFO index in LIST
   *    Object.TAG is the tag index in the INFO
   * @private
   */
  getTagIndex_(tag) {
    /** @type {!Object<string, ?number>} */
    let index = {LIST: null, TAG: null};
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format == 'INFO') {
        index.LIST = i;
        for (let j=0, subLen = this.LIST[i].subChunks.length; j < subLen; j++) {
          if (this.LIST[i].subChunks[j].chunkId == tag) {
            index.TAG = j;
            break;
          }
        }
        break;
      }
    }
    return index;
  }
}

/**
 * Fix a RIFF tag format if possible, throw an error otherwise.
 * @param {string} tag The tag name.
 * @return {string} The tag name in proper fourCC format.
 * @private
 */
function fixRIFFTag_(tag) {
  if (tag.constructor !== String) {
    throw new Error('Invalid tag name.');
  } else if (tag.length < 4) {
    for (let i = 0, len = 4 - tag.length; i < len; i++) {
      tag += ' ';
    }
  }
  return tag;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to edit meta information in wav files.
 * @extends WaveFileTagEditor
 * @ignore
 */
class WaveFileCueEditor extends WaveFileTagEditor {

  /**
   * Return an array with all cue points in the file, in the order they appear
   * in the file.
   * Objects representing cue points/regions look like this:
   *   {
   *     position: 500, // the position in milliseconds
   *     label: 'cue marker 1',
   *     end: 1500, // the end position in milliseconds
   *     dwName: 1,
   *     dwPosition: 0,
   *     fccChunk: 'data',
   *     dwChunkStart: 0,
   *     dwBlockStart: 0,
   *     dwSampleOffset: 22050, // the position as a sample offset
   *     dwSampleLength: 3646827, // length as a sample count, 0 if not a region
   *     dwPurposeID: 544106354,
   *     dwCountry: 0,
   *     dwLanguage: 0,
   *     dwDialect: 0,
   *     dwCodePage: 0,
   *   }
   * @return {!Array<Object>}
   */
  listCuePoints() {
    /** @type {!Array<!Object>} */
    let points = this.getCuePoints_();
    for (let i = 0, len = points.length; i < len; i++) {

      // Add attrs that should exist in the object
      points[i].position =
        (points[i].dwSampleOffset / this.fmt.sampleRate) * 1000;

      // If it is a region, calc the end
      // position in milliseconds
      if (points[i].dwSampleLength) {
        points[i].end =
          (points[i].dwSampleLength / this.fmt.sampleRate) * 1000;
        points[i].end += points[i].position;
      // If its not a region, end should be null
      } else {
        points[i].end = null;
      }

      // Remove attrs that should not go in the results
      delete points[i].value;
    }
    return points;
  }

  /**
   * Create a cue point in the wave file.
   * @param {!{
   *   position: number,
   *   label: ?string,
   *   end: ?number,
   *   dwPurposeID: ?number,
   *   dwCountry: ?number,
   *   dwLanguage: ?number,
   *   dwDialect: ?number,
   *   dwCodePage: ?number
   * }} pointData A object with the data of the cue point.
   *
   * # Only required attribute to create a cue point:
   * pointData.position: The position of the point in milliseconds
   *
   * # Optional attribute for cue points:
   * pointData.label: A string label for the cue point
   *
   * # Extra data used for regions
   * pointData.end: A number representing the end of the region,
   *   in milliseconds, counting from the start of the file. If
   *   no end attr is specified then no region is created.
   *
   * # You may also specify the following attrs for regions, all optional:
   * pointData.dwPurposeID
   * pointData.dwCountry
   * pointData.dwLanguage
   * pointData.dwDialect
   * pointData.dwCodePage
   */
  setCuePoint(pointData) {
    this.cue.chunkId = 'cue ';

    // label attr should always exist
    if (!pointData.label) {
      pointData.label = '';
    }

    /**
     * Load the existing points before erasing
     * the LIST 'adtl' chunk and the cue attr
     * @type {!Array<!Object>}
     */
    let existingPoints = this.getCuePoints_();

    // Clear any LIST labeled 'adtl'
    // The LIST chunk should be re-written
    // after the new cue point is created
    this.clearLISTadtl_();

    // Erase this.cue so it can be re-written
    // after the point is added
    this.cue.points = [];

    /**
     * Cue position param is informed in milliseconds,
     * here its value is converted to the sample offset
     * @type {number}
     */
    pointData.dwSampleOffset =
      (pointData.position * this.fmt.sampleRate) / 1000;
    /**
     * end param is informed in milliseconds, counting
     * from the start of the file.
     * here its value is converted to the sample length
     * of the region.
     * @type {number}
     */
    pointData.dwSampleLength = 0;
    if (pointData.end) {
      pointData.dwSampleLength = 
        ((pointData.end * this.fmt.sampleRate) / 1000) -
        pointData.dwSampleOffset;
    }

    // If there were no cue points in the file,
    // insert the new cue point as the first
    if (existingPoints.length === 0) {
      this.setCuePoint_(pointData, 1);

    // If the file already had cue points, This new one
    // must be added in the list according to its position.
    } else {
      this.setCuePointInOrder_(existingPoints, pointData);
    }
    this.cue.dwCuePoints = this.cue.points.length;
  }

  /**
   * Remove a cue point from a wave file.
   * @param {number} index the index of the point. First is 1,
   *    second is 2, and so on.
   */
  deleteCuePoint(index) {
    this.cue.chunkId = 'cue ';
    /** @type {!Array<!Object>} */
    let existingPoints = this.getCuePoints_();
    this.clearLISTadtl_();
    /** @type {number} */
    let len = this.cue.points.length;
    this.cue.points = [];
    for (let i = 0; i < len; i++) {
      if (i + 1 !== index) {
        this.setCuePoint_(existingPoints[i], i + 1);
      }
    }
    this.cue.dwCuePoints = this.cue.points.length;
    if (this.cue.dwCuePoints) {
      this.cue.chunkId = 'cue ';
    } else {
      this.cue.chunkId = '';
      this.clearLISTadtl_();
    }
  }

  /**
   * Update the label of a cue point.
   * @param {number} pointIndex The ID of the cue point.
   * @param {string} label The new text for the label.
   */
  updateLabel(pointIndex, label) {
    /** @type {?number} */
    let cIndex = this.getLISTIndex('adtl');
    if (cIndex !== null) {
      for (let i = 0, len = this.LIST[cIndex].subChunks.length; i < len; i++) {
        if (this.LIST[cIndex].subChunks[i].dwName ==
            pointIndex) {
          this.LIST[cIndex].subChunks[i].value = label;
        }
      }
    }
  }

  /**
   * Return an array with all cue points in the file, in the order they appear
   * in the file.
   * @return {!Array<!Object>}
   * @private
   */
  getCuePoints_() {
    /** @type {!Array<!Object>} */
    let points = [];
    for (let i = 0; i < this.cue.points.length; i++) {
      /** @type {!Object} */
      let chunk = this.cue.points[i];
      /** @type {!Object} */
      let pointData = this.getDataForCuePoint_(chunk.dwName);
      pointData.label = pointData.value ? pointData.value : '';
      pointData.dwPosition = chunk.dwPosition;
      pointData.fccChunk = chunk.fccChunk;
      pointData.dwChunkStart = chunk.dwChunkStart;
      pointData.dwBlockStart = chunk.dwBlockStart;
      pointData.dwSampleOffset = chunk.dwSampleOffset;
      points.push(pointData);
    }
    return points;
  }

  /**
   * Return the associated data of a cue point.
   * @param {number} pointDwName The ID of the cue point.
   * @return {!Object}
   * @private
   */
  getDataForCuePoint_(pointDwName) {
    /** @type {?number} */
    let LISTindex = this.getLISTIndex('adtl');
    /** @type {!Object} */
    let pointData = {};
    // If there is a adtl LIST in the file, look for
    // LIST subchunks with data referencing this point
    if (LISTindex !== null) {
      this.getCueDataFromLIST_(pointData, LISTindex, pointDwName);
    }
    return pointData;
  }

  /**
   * Get all data associated to a cue point in a LIST chunk.
   * @param {!Object} pointData A object to hold the point data.
   * @param {number} index The index of the adtl LIST chunk.
   * @param {number} pointDwName The ID of the cue point.
   * @private
   */
  getCueDataFromLIST_(pointData, index, pointDwName) {
    // got through all chunks in the adtl LIST checking
    // for references to this cue point
    for (let i = 0, len = this.LIST[index].subChunks.length; i < len; i++) {
      if (this.LIST[index].subChunks[i].dwName == pointDwName) {
        /** @type {!Object} */
        let chunk = this.LIST[index].subChunks[i];
        // Some chunks may reference the point but
        // have a empty text; this is to ensure that if
        // one chunk that reference the point has a text,
        // this value will be kept as the associated data label
        // for the cue point.
        // If different values are present, the last value found
        // will be considered the label for the cue point.
        pointData.value = chunk.value || pointData.value;
        pointData.dwName = chunk.dwName || 0;
        pointData.dwSampleLength = chunk.dwSampleLength || 0;
        pointData.dwPurposeID = chunk.dwPurposeID || 0;
        pointData.dwCountry = chunk.dwCountry || 0;
        pointData.dwLanguage = chunk.dwLanguage || 0;
        pointData.dwDialect = chunk.dwDialect || 0;
        pointData.dwCodePage = chunk.dwCodePage || 0;
      }
    }
  }

  /**
   * Push a new cue point in this.cue.points.
   * @param {!Object} pointData A object with data of the cue point.
   * @param {number} dwName the dwName of the cue point
   * @private
   */
  setCuePoint_(pointData, dwName) {
    this.cue.points.push({
      dwName: dwName,
      dwPosition: pointData.dwPosition ? pointData.dwPosition : 0,
      fccChunk: pointData.fccChunk ? pointData.fccChunk : 'data',
      dwChunkStart: pointData.dwChunkStart ? pointData.dwChunkStart : 0,
      dwBlockStart: pointData.dwBlockStart ? pointData.dwBlockStart : 0,
      dwSampleOffset: pointData.dwSampleOffset
    });
    this.setLabl_(pointData, dwName);
  }

  /**
   * Push a new cue point in this.cue.points according to existing cue points.
   * @param {!Array} existingPoints Array with the existing points.
   * @param {!Object} pointData A object with data of the cue point.
   * @private
   */
  setCuePointInOrder_(existingPoints, pointData) {
    /** @type {boolean} */
    let hasSet = false;

    // Iterate over the cue points that existed
    // before this one was added
    for (let i = 0; i < existingPoints.length; i++) {

      // If the new point is located before this original point
      // and the new point have not been created, create the
      // new point and then the original point
      if (existingPoints[i].dwSampleOffset > 
        pointData.dwSampleOffset && !hasSet) {
        // create the new point
        this.setCuePoint_(pointData, i + 1);

        // create the original point
        this.setCuePoint_(existingPoints[i], i + 2);
        hasSet = true;

      // Otherwise, re-create the original point
      } else {
        this.setCuePoint_(existingPoints[i], hasSet ? i + 2 : i + 1);
      }
    }
    // If no point was created in the above loop,
    // create the new point as the last one
    if (!hasSet) {
      this.setCuePoint_(pointData, this.cue.points.length + 1);
    }
  }

  /**
   * Clear any LIST chunk labeled as 'adtl'.
   * @private
   */
  clearLISTadtl_() {
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format == 'adtl') {
        this.LIST.splice(i);
      }
    }
  }

  /**
   * Create a new 'labl' subchunk in a 'LIST' chunk of type 'adtl'.
   * This method creates a LIST adtl chunk in the file if one
   * is not present.
   * @param {!Object} pointData A object with data of the cue point.
   * @param {number} dwName The ID of the cue point.
   * @private
   */
  setLabl_(pointData, dwName) {
    /**
     * Get the index of the LIST chunk labeled as adtl.
     * A file can have many LIST chunks with unique labels.
     * @type {?number}
     */
    let adtlIndex = this.getLISTIndex('adtl');
    // If there is no adtl LIST, create one
    if (adtlIndex === null) {
      // Include a new item LIST chunk
      this.LIST.push({
        chunkId: 'LIST',
        chunkSize: 4,
        format: 'adtl',
        subChunks: []});
      // Get the index of the new LIST chunk
      adtlIndex = this.LIST.length - 1;
    }
    this.setLabelText_(adtlIndex, pointData, dwName);
    if (pointData.dwSampleLength) {
      this.setLtxtChunk_(adtlIndex, pointData, dwName);
    }
  }

  /**
   * Create a new 'labl' subchunk in a 'LIST' chunk of type 'adtl'.
   * @param {number} adtlIndex The index of the 'adtl' LIST in this.LIST.
   * @param {!Object} pointData A object with data of the cue point.
   * @param {number} dwName The ID of the cue point.
   * @private
   */
  setLabelText_(adtlIndex, pointData, dwName) {
    this.LIST[adtlIndex].subChunks.push({
      chunkId: 'labl',
      chunkSize: 4, // should be 4 + label length in bytes
      dwName: dwName,
      value: pointData.label
    });
    this.LIST[adtlIndex].chunkSize += 12; // should be 4 + label byte length
  }
  /**
   * Create a new 'ltxt' subchunk in a 'LIST' chunk of type 'adtl'.
   * @param {number} adtlIndex The index of the 'adtl' LIST in this.LIST.
   * @param {!Object} pointData A object with data of the cue point.
   * @param {number} dwName The ID of the cue point.
   * @private
   */
  setLtxtChunk_(adtlIndex, pointData, dwName) {
    this.LIST[adtlIndex].subChunks.push({
      chunkId: 'ltxt',
      chunkSize: 20,  // should be 12 + label byte length
      dwName: dwName,
      dwSampleLength: pointData.dwSampleLength,
      dwPurposeID: pointData.dwPurposeID || 0,
      dwCountry: pointData.dwCountry || 0,
      dwLanguage: pointData.dwLanguage || 0,
      dwDialect: pointData.dwDialect || 0,
      dwCodePage: pointData.dwCodePage || 0,
      value: pointData.label // kept for compatibility
    });
    this.LIST[adtlIndex].chunkSize += 28;
  }
}

/*
 * Copyright (c) 2019 Rafael da Silva Rocha.
 * Copyright 2012 Spencer Cohen
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview The Interpolator class. Based on Smooth.js by Spencer Cohen.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/osuushi/Smooth.js
 */

/**
 * A class to get scaled values out of arrays.
 * @extends WaveFileReader
 */
class Interpolator {
  
  /**
   * @param {number} scaleFrom the length of the original array.
   * @param {number} scaleTo The length of the new array.
   * @param {!Object} details The extra configuration, if needed.
   */
  constructor(scaleFrom, scaleTo, details) {
    /**
     * The length of the original array.
     * @type {number}
     */
    this.length_ = scaleFrom;
    /**
     * The scaling factor.
     * @type {number}
     */
    this.scaleFactor_ = (scaleFrom - 1) / scaleTo;
    /**
     * The interpolation function.
     * @type {Function}
     */
    this.interpolate = this.sinc;
    if (details.method === 'point') {
    	this.interpolate = this.point;
    } else if(details.method === 'linear') {
    	this.interpolate = this.linear;
    } else if(details.method === 'cubic') {
    	this.interpolate = this.cubic;
    }
    /**
     * The tanget factor for cubic interpolation.
     * @type {number}
     */
    this.tangentFactor_ = 1 - Math.max(0, Math.min(1, details.tension || 0));
    // Configure the kernel for sinc
    /**
     * The sinc filter size.
     * @type {number}
     */
    this.sincFilterSize_ = details.sincFilterSize || 1;
    /**
     * The sinc kernel.
     * @type {Function}
     */
    this.kernel_ = sincKernel_(details.sincWindow || window_);
  }

  /**
   * @param {number} t The index to interpolate.
   * @param {Array<number>|TypedArray} samples the original array.
   * @return {number} The interpolated value.
   */
  point(t, samples) {
    return this.getClippedInput_(Math.round(this.scaleFactor_ * t), samples);
  }

  /**
   * @param {number} t The index to interpolate.
   * @param {Array<number>|TypedArray} samples the original array.
   * @return {number} The interpolated value.
   */
  linear(t, samples) {
    t = this.scaleFactor_ * t;
    /** @type {number} */
    let k = Math.floor(t);
    t -= k;
    return (1 - t) *
    	this.getClippedInput_(k, samples) + t *
    	this.getClippedInput_(k + 1, samples);
  }

  /**
   * @param {number} t The index to interpolate.
   * @param {Array<number>|TypedArray} samples the original array.
   * @return {number} The interpolated value.
   */
  cubic(t, samples) {
    t = this.scaleFactor_ * t;
    /** @type {number} */
    let k = Math.floor(t);
    /** @type {Array<number>} */
    let m = [this.getTangent_(k, samples), this.getTangent_(k + 1, samples)];
    /** @type {Array<number>} */
    let p = [this.getClippedInput_(k, samples),
      this.getClippedInput_(k + 1, samples)];
    t -= k;
    /** @type {number} */
    let t2 = t * t;
    /** @type {number} */
    let t3 = t * t2;
    return (2 * t3 - 3 * t2 + 1) *
      p[0] + (t3 - 2 * t2 + t) *
      m[0] + (-2 * t3 + 3 * t2) *
      p[1] + (t3 - t2) * m[1];
  }

  /**
   * @param {number} t The index to interpolate.
   * @param {Array<number>|TypedArray} samples the original array.
   * @return {number} The interpolated value.
   */
  sinc(t, samples) {
    t = this.scaleFactor_ * t;
    /** @type {number} */
    let k = Math.floor(t);
    /** @type {number} */
    let ref = k - this.sincFilterSize_ + 1;
    /** @type {number} */
    let ref1 = k + this.sincFilterSize_;
    /** @type {number} */
    let sum = 0;
    for (let n = ref; n <= ref1; n++) {
      sum += this.kernel_(t - n) * this.getClippedInput_(n, samples);
    }
    return sum;
  }

  /**
   * @param {number} k The scaled index to interpolate.
   * @param {Array<number>|TypedArray} samples the original array.
   * @return {number} The tangent.
   * @private
   */
  getTangent_(k, samples) {
    return this.tangentFactor_ *
      (this.getClippedInput_(k + 1, samples) -
        this.getClippedInput_(k - 1, samples)) / 2;
  }

  /**
   * @param {number} t The scaled index to interpolate.
   * @param {Array<number>|TypedArray} samples the original array.
   * @return {number} The interpolated value.
   * @private
   */
  getClippedInput_(t, samples) {
    if ((0 <= t && t < this.length_)) {
      return samples[t];
    }
    return 0;
  }
}

/**
 * The default window function.
 * @param {number} x The sinc signal.
 * @return {number}
 * @private
 */
function window_(x) {
  return Math.exp(-x / 2 * x / 2);
}

/**
 * @param {Function} window The window function.
 * @return {Function}
 * @private
 */
function sincKernel_(window) {
  return function(x) { return sinc_(x) * window(x); };
}

/**
 * @param {number} x The sinc signal.
 * @return {number}
 * @private
 */
function sinc_(x) {
  if (x === 0) {
    return 1;
  }
  return Math.sin(Math.PI * x) / (Math.PI * x);
}

/*
 * Copyright (c) 2019 Rafael da Silva Rocha.
 * Copyright (c) 2014 Florian Markert
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview FIR LPF. Based on the FIR LPF from Fili by Florian Markert.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/markert/fili.js
 */

/**
 * A FIR low pass filter.
 */
class FIRLPF {
  
  /**
   * @param {number} order The order of the filter.
   * @param {number} sampleRate The sample rate.
   * @param {number} cutOff The cut off frequency.
   */
  constructor(order, sampleRate, cutOff) {
    /** @type {number} */
    let omega = 2 * Math.PI * cutOff / sampleRate;
    /** @type {number} */
    let dc = 0;
    this.filters = [];
    for (let i = 0; i <= order; i++) {
      if (i - order / 2 === 0) {
        this.filters[i] = omega;
      } else {
        this.filters[i] = Math.sin(omega * (i - order / 2)) / (i - order / 2);
        // Hamming window
        this.filters[i] *= (0.54 - 0.46 * Math.cos(2 * Math.PI * i / order));
      }
      dc = dc + this.filters[i];
    }
    // normalize
    for (let i = 0; i <= order; i++) {
      this.filters[i] /= dc;
    }
    this.z = this.initZ_();
  }

  /**
   * @param {number} sample A sample of a sequence.
   * @return {number}
   */
  filter(sample) {
    this.z.buf[this.z.pointer] = sample;
    /** @type {number} */
    let out = 0;
    for (let i = 0, len = this.z.buf.length; i < len; i++) {
      out += (
        this.filters[i] * this.z.buf[(this.z.pointer + i) % this.z.buf.length]);
    }
    this.z.pointer = (this.z.pointer + 1) % (this.z.buf.length);
    return out;
  }

  /**
   * Reset the filter.
   */
  reset() {
    this.z = this.initZ_();
  }

  /**
   * Return the default value for z.
   * @private
   */
  initZ_() {
    /** @type {!Array} */
    let r = [];
    for (let i = 0; i < this.filters.length - 1; i++) {
      r.push(0);
    }
    return {
      buf: r,
      pointer: 0
    };
  }
}

/*
 * Copyright (c) 2019 Rafael da Silva Rocha.
 * Copyright (c) 2014 Florian Markert
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview Butterworth LPF. Based on the Butterworth LPF from Fili.js.
 * @see https://github.com/rochars/wavefile
 * @see https://github.com/markert/fili.js
 */

/**
 * Butterworth LPF.
 */
class ButterworthLPF {
  
  /**
   * @param {number} order The order of the filter.
   * @param {number} sampleRate The sample rate.
   * @param {number} cutOff The cut off frequency.
   */
  constructor(order, sampleRate, cutOff) {
    /** @type {!Array} */
    let filters = [];
    for (let i = 0; i < order; i++) {
      filters.push(this.getCoeffs_({
        Fs: sampleRate,
        Fc: cutOff,
        Q: 0.5 / (Math.sin((Math.PI / (order * 2)) * (i + 0.5)))
      }));
    }
    this.stages = [];
    for (let i = 0; i < filters.length; i++) {
      this.stages[i] = {
        b0 : filters[i].b[0],
        b1 : filters[i].b[1],
        b2 : filters[i].b[2],
        a1 : filters[i].a[0],
        a2 : filters[i].a[1],
        k : filters[i].k,
        z : [0, 0]
      };
    }
  }

  /**
   * @param {number} sample A sample of a sequence.
   * @return {number}
   */
  filter(sample) {
    /** @type {number} */
    let out = sample;
    for (let i = 0, len = this.stages.length; i < len; i++) {
      out = this.runStage_(i, out);
    }
    return out;
  }

  /**
   * @param {!Object} params The filter params.
   * @return {!Object}
   */
  getCoeffs_(params) {
    /** @type {!Object} */
    let coeffs = {};
    coeffs.a = [];
    coeffs.b = [];
    /** @type {!Object} */
    let p = this.preCalc_(params, coeffs);
    coeffs.k = 1;
    coeffs.b.push((1 - p.cw) / (2 * p.a0));
    coeffs.b.push(2 * coeffs.b[0]);
    coeffs.b.push(coeffs.b[0]);
    return coeffs;
  }

  /**
   * @param {!Object} params The filter params.
   * @param {!Object} coeffs The coefficients template.
   * @return {!Object}
   */
  preCalc_(params, coeffs) {
    /** @type {!Object} */
    let pre = {};
    /** @type {number} */
    let w = 2 * Math.PI * params.Fc / params.Fs;
    pre.alpha = Math.sin(w) / (2 * params.Q);
    pre.cw = Math.cos(w);
    pre.a0 = 1 + pre.alpha;
    coeffs.a0 = pre.a0;
    coeffs.a.push((-2 * pre.cw) / pre.a0);
    coeffs.k = 1;
    coeffs.a.push((1 - pre.alpha) / pre.a0);
    return pre;
  }
  
  /**
   * @param {number} i The stage index.
   * @param {number} sample The sample.
   * @return {number}
   */
  runStage_(i, sample) {
    /** @type {number} */
    let temp = sample * this.stages[i].k - this.stages[i].a1 *
      this.stages[i].z[0] - this.stages[i].a2 * this.stages[i].z[1];
    /** @type {number} */
    let out = this.stages[i].b0 * temp + this.stages[i].b1 *
      this.stages[i].z[0] + this.stages[i].b2 * this.stages[i].z[1];
    this.stages[i].z[1] = this.stages[i].z[0];
    this.stages[i].z[0] = temp;
    return out;
  }

  /**
   * Reset the filter.
   */
  reset() {
    for (let i = 0; i < this.stages.length; i++) {
      this.stages[i].z = [0, 0];
    }
  }
}

/*
 * Copyright (c) 2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * Default use of LPF for each resampling method.
 * @readonly
 * @enum {boolean}
 * @private
 */
const DEFAULT_LPF_USE = {
  'point': false,
  'linear': false,
  'cubic': true,
  'sinc': true
};

/**
 * Default LPF order for each type of LPF.
 * @readonly
 * @enum {number}
 * @private
 */
const DEFAULT_LPF_ORDER = {
  'IIR': 16,
  'FIR': 71
};

/**
 * Default LPF class for each type of LPF.
 * @readonly
 * @enum {!Function}
 * @private
 */
const DEFAULT_LPF = {
  'IIR': ButterworthLPF,
  'FIR': FIRLPF
};

/**
 * Change the sample rate of the samples to a new sample rate.
 * @param {!Array<number>|!TypedArray} samples The original samples.
 * @param {number} oldSampleRate The original sample rate.
 * @param {number} sampleRate The target sample rate.
 * @param {Object=} options The extra configuration, if needed.
 * @return {!Float64Array} the new samples.
 */
function resample(samples, oldSampleRate, sampleRate, options=null) {
  options = options || {};
  // Make the new sample container
  /** @type {number} */
  let rate = ((sampleRate - oldSampleRate) / oldSampleRate) + 1;
  /** @type {!Float64Array} */
  let newSamples = new Float64Array(samples.length * (rate));
  // Create the interpolator
  options.method = options.method || 'cubic';
  /** @type {!Object} */
  let interpolator = new Interpolator(
    samples.length,
    newSamples.length,
    {
      method: options.method,
      tension: options.tension || 0,
      sincFilterSize: options.sincFilterSize || 6,
      sincWindow: options.sincWindow || undefined,
      clip: options.clip || 'mirror'
    });
  // Resample + LPF
  if (options.LPF === undefined) {
    options.LPF = DEFAULT_LPF_USE[options.method];
  } 
  if (options.LPF) {
    options.LPFType = options.LPFType || 'IIR';
    const LPF = DEFAULT_LPF[options.LPFType];
    // Upsampling
    if (sampleRate > oldSampleRate) {
      /** @type {!Object} */
      let filter = new LPF(
        options.LPForder || DEFAULT_LPF_ORDER[options.LPFType],
        sampleRate,
        (oldSampleRate / 2));
      upsample_(
        samples, newSamples, interpolator, filter);
    // Downsampling
    } else {
      /** @type {!Object} */
      let filter = new LPF(
        options.LPForder || DEFAULT_LPF_ORDER[options.LPFType],
        oldSampleRate,
        sampleRate / 2);
      downsample_(
        samples, newSamples, interpolator, filter);
    }
  // Resample, no LPF
  } else {
    resample_(samples, newSamples, interpolator);
  }
  return newSamples;
}

/**
 * Resample.
 * @param {!Array<number>|!TypedArray} samples The original samples.
 * @param {!Float64Array} newSamples The container for the new samples.
 * @param {Object} interpolator The interpolator.
 * @private
 */
function resample_(samples, newSamples, interpolator) {
  // Resample
  for (let i = 0, len = newSamples.length; i < len; i++) {
    newSamples[i] = interpolator.interpolate(i, samples);
  }
}

/**
 * Upsample with LPF.
 * @param {!Array<number>|!TypedArray} samples The original samples.
 * @param {!Float64Array} newSamples The container for the new samples.
 * @param {Object} interpolator The interpolator.
 * @param {Object} filter The LPF object.
 * @private
 */
function upsample_(samples, newSamples, interpolator, filter) {
  // Resample and filter
  for (let i = 0, len = newSamples.length; i < len; i++) {
    newSamples[i] = filter.filter(interpolator.interpolate(i, samples));
  }
  // Reverse filter
  filter.reset();
  for (let i = newSamples.length - 1; i >= 0; i--) {
    newSamples[i]  = filter.filter(newSamples[i]);
  }
}

/**
 * Downsample with LPF.
 * @param {!Array<number>|!TypedArray} samples The original samples.
 * @param {!Float64Array} newSamples The container for the new samples.
 * @param {Object} interpolator The interpolator.
 * @param {Object} filter The LPF object.
 * @private
 */
function downsample_(samples, newSamples, interpolator, filter) {
  // Filter
  for (let i = 0, len = samples.length; i < len; i++) {
    samples[i]  = filter.filter(samples[i]);
  }
  // Reverse filter
  filter.reset();
  for (let i = samples.length - 1; i >= 0; i--) {
    samples[i]  = filter.filter(samples[i]);
  }
  // Resample
  resample_(samples, newSamples, interpolator);
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to convert wav files to other types of wav files.
 * @extends WaveFileCueEditor
 * @ignore
 */
class WaveFileConverter extends WaveFileCueEditor {

  /**
   * Force a file as RIFF.
   */
  toRIFF() {
    /** @type {!Float64Array} */
    let output = new Float64Array(
      outputSize_(this.data.samples.length, this.dataType.bits / 8));
    unpackArrayTo(this.data.samples, this.dataType, output,
      0, this.data.samples.length);
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      this.bitDepth,
      output,
      {container: 'RIFF'});
  }

  /**
   * Force a file as RIFX.
   */
  toRIFX() {
    /** @type {!Float64Array} */
    let output = new Float64Array(
      outputSize_(this.data.samples.length, this.dataType.bits / 8));
    unpackArrayTo(this.data.samples, this.dataType, output,
      0, this.data.samples.length);
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      this.bitDepth,
      output,
      {container: 'RIFX'});
  }

  /**
   * Encode a 16-bit wave file as 4-bit IMA ADPCM.
   * @throws {Error} If sample rate is not 8000.
   * @throws {Error} If number of channels is not 1.
   */
  toIMAADPCM() {
    if (this.fmt.sampleRate !== 8000) {
      throw new Error(
        'Only 8000 Hz files can be compressed as IMA-ADPCM.');
    } else if (this.fmt.numChannels !== 1) {
      throw new Error(
        'Only mono files can be compressed as IMA-ADPCM.');
    } else {
      this.assure16Bit_();
      /** @type {!Int16Array} */
      let output = new Int16Array(
        outputSize_(this.data.samples.length, 2));
      unpackArrayTo(this.data.samples, this.dataType, output,
        0, this.data.samples.length);
      this.fromExisting_(
        this.fmt.numChannels,
        this.fmt.sampleRate,
        '4',
        encode$2(output),
        {container: this.correctContainer_()});
    }
  }

  /**
   * Decode a 4-bit IMA ADPCM wave file as a 16-bit wave file.
   * @param {string=} [bitDepthCode='16'] The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats).
   */
  fromIMAADPCM(bitDepthCode='16') {
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '16',
      decode$2(this.data.samples, this.fmt.blockAlign),
      {container: this.correctContainer_()});
    if (bitDepthCode != '16') {
      this.toBitDepth(bitDepthCode);
    }
  }

  /**
   * Encode a 16-bit wave file as 8-bit A-Law.
   */
  toALaw() {
    this.assure16Bit_();
    /** @type {!Int16Array} */
    let output = new Int16Array(
      outputSize_(this.data.samples.length, 2));
    unpackArrayTo(this.data.samples, this.dataType, output,
        0, this.data.samples.length);
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '8a',
      encode$1(output),
      {container: this.correctContainer_()});
  }

  /**
   * Decode a 8-bit A-Law wave file into a 16-bit wave file.
   * @param {string=} [bitDepthCode='16'] The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats).
   */
  fromALaw(bitDepthCode='16') {
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '16',
      decode$1(this.data.samples),
      {container: this.correctContainer_()});
    if (bitDepthCode != '16') {
      this.toBitDepth(bitDepthCode);
    }
  }

  /**
   * Encode 16-bit wave file as 8-bit mu-Law.
   */
  toMuLaw() {
    this.assure16Bit_();
    /** @type {!Int16Array} */
    let output = new Int16Array(
      outputSize_(this.data.samples.length, 2));
    unpackArrayTo(this.data.samples, this.dataType, output,
        0, this.data.samples.length);
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '8m',
      encode(output),
      {container: this.correctContainer_()});
  }

  /**
   * Decode a 8-bit mu-Law wave file into a 16-bit wave file.
   * @param {string=} [bitDepthCode='16'] The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats).
   */
  fromMuLaw(bitDepthCode='16') {
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '16',
      decode(this.data.samples),
      {container: this.correctContainer_()});
    if (bitDepthCode != '16') {
      this.toBitDepth(bitDepthCode);
    }
  }

  /**
   * Change the bit depth of the samples.
   * @param {string} newBitDepth The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats)
   * @param {boolean=} [changeResolution=true] A boolean indicating if the
   *    resolution of samples should be actually changed or not.
   * @throws {Error} If the bit depth is not valid.
   */
  toBitDepth(newBitDepth, changeResolution=true) {
    /** @type {string} */
    let toBitDepth = newBitDepth;
    /** @type {string} */
    let thisBitDepth = this.bitDepth;
    if (!changeResolution) {
      if (newBitDepth != '32f') {
        toBitDepth = this.dataType.bits.toString();
      }
      thisBitDepth = '' + this.dataType.bits;
    }
    // If the file is compressed, make it
    // PCM before changing the bit depth
    this.assureUncompressed_();
    /**
     * The original samples, interleaved.
     * @type {!(Array|TypedArray)}
     */
    let samples = this.getSamples(true);
    /**
     * The container for the new samples.
     * @type {!Float64Array}
     */
    let newSamples = new Float64Array(samples.length);
    // Change the bit depth
    changeBitDepth(samples, thisBitDepth, newSamples, toBitDepth);
    // Re-create the file
    this.fromExisting_(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      newBitDepth,
      newSamples,
      {container: this.correctContainer_()});
  }

  /**
   * Convert the sample rate of the file.
   * @param {number} sampleRate The target sample rate.
   * @param {Object=} options The extra configuration, if needed.
   */
  toSampleRate(sampleRate, options) {
    this.validateResample_(sampleRate);
    /** @type {!(Array|TypedArray)} */
    let samples = this.getSamples();
    /** @type {!(Array|Float64Array)} */
    let newSamples = [];
    // Mono files
    if (samples.constructor === Float64Array) {
      newSamples = resample(samples, this.fmt.sampleRate, sampleRate, options);
    // Multi-channel files
    } else {
      for (let i = 0; i < samples.length; i++) {
        newSamples.push(resample(
          samples[i], this.fmt.sampleRate, sampleRate, options));
      }
    }
    // Recreate the file
    this.fromExisting_(
      this.fmt.numChannels, sampleRate, this.bitDepth, newSamples,
      {'container': this.correctContainer_()});
  }

  /**
   * Validate the conditions for resampling.
   * @param {number} sampleRate The target sample rate.
   * @throws {Error} If the file cant be resampled.
   * @private
   */
  validateResample_(sampleRate) {
    if (!validateSampleRate(
        this.fmt.numChannels, this.fmt.bitsPerSample, sampleRate)) {
      throw new Error('Invalid sample rate.');
    } else if (['4','8a','8m'].indexOf(this.bitDepth) > -1) {
      throw new Error(
        'wavefile can\'t change the sample rate of compressed files.');
    }
  }

  /**
   * Make the file 16-bit if it is not.
   * @private
   */
  assure16Bit_() {
    this.assureUncompressed_();
    if (this.bitDepth != '16') {
      this.toBitDepth('16');
    }
  }

  /**
   * Uncompress the samples in case of a compressed file.
   * @private
   */
  assureUncompressed_() {
    if (this.bitDepth == '8a') {
      this.fromALaw();
    } else if (this.bitDepth == '8m') {
      this.fromMuLaw();
    } else if (this.bitDepth == '4') {
      this.fromIMAADPCM();
    }
  }

  /**
   * Return 'RIFF' if the container is 'RF64', the current container name
   * otherwise. Used to enforce 'RIFF' when RF64 is not allowed.
   * @return {string}
   * @private
   */
  correctContainer_() {
    return this.container == 'RF64' ? 'RIFF' : this.container;
  }

  /**
   * Set up the WaveFileCreator object based on the arguments passed.
   * This method only reset the fmt , fact, ds64 and data chunks.
   * @param {number} numChannels The number of channels
   *    (Integer numbers: 1 for mono, 2 stereo and so on).
   * @param {number} sampleRate The sample rate.
   *    Integer numbers like 8000, 44100, 48000, 96000, 192000.
   * @param {string} bitDepthCode The audio bit depth code.
   *    One of '4', '8', '8a', '8m', '16', '24', '32', '32f', '64'
   *    or any value between '8' and '32' (like '12').
   * @param {!(Array|TypedArray)} samples
   *    The samples. Must be in the correct range according to the bit depth.
   * @param {Object} options Used to define the container. Uses RIFF by default.
   * @throws {Error} If any argument does not meet the criteria.
   * @private
   */
  fromExisting_(numChannels, sampleRate, bitDepthCode, samples, options) {
    /** @type {!Object} */
    let tmpWav = new WaveFileCueEditor();
    Object.assign(this.fmt, tmpWav.fmt);
    Object.assign(this.fact, tmpWav.fact);
    Object.assign(this.ds64, tmpWav.ds64);
    Object.assign(this.data, tmpWav.data);
    this.newWavFile_(numChannels, sampleRate, bitDepthCode, samples, options);
  }
}

/**
 * Return the size in bytes of the output sample array when applying
 * compression to 16-bit samples.
 * @return {number}
 * @private
 */
function outputSize_(byteLen, byteOffset) {
  /** @type {number} */
  let outputSize = byteLen / byteOffset;
  if (outputSize % 2) {
    outputSize++;
  }
  return outputSize;
}

/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */


/**
 * A class to manipulate wav files.
 * @extends WaveFileConverter
 */
class WaveFile extends WaveFileConverter {

  /**
   * @param {Uint8Array=} wav A wave file buffer.
   * @throws {Error} If container is not RIFF, RIFX or RF64.
   * @throws {Error} If format is not WAVE.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @throws {Error} If no 'data' chunk is found.
   */
  constructor(wav) {
    super();
    if (wav) {
      this.fromBuffer(wav);
    }
  }

  /**
   * Use a .wav file encoded as a base64 string to load the WaveFile object.
   * @param {string} base64String A .wav file as a base64 string.
   * @throws {Error} If any property of the object appears invalid.
   */
  fromBase64(base64String) {
    this.fromBuffer(decode$3(base64String));
  }

  /**
   * Return a base64 string representig the WaveFile object as a .wav file.
   * @return {string} A .wav file as a base64 string.
   * @throws {Error} If any property of the object appears invalid.
   */
  toBase64() {
    return encode$3(this.toBuffer());
  }

  /**
   * Return a DataURI string representig the WaveFile object as a .wav file.
   * The return of this method can be used to load the audio in browsers.
   * @return {string} A .wav file as a DataURI.
   * @throws {Error} If any property of the object appears invalid.
   */
  toDataURI() {
    return 'data:audio/wav;base64,' + this.toBase64();
  }

  /**
   * Use a .wav file encoded as a DataURI to load the WaveFile object.
   * @param {string} dataURI A .wav file as DataURI.
   * @throws {Error} If any property of the object appears invalid.
   */
  fromDataURI(dataURI) {
    this.fromBase64(dataURI.replace('data:audio/wav;base64,', ''));
  }
}

function FFT(size) {
  this.size = size | 0;
  if (this.size <= 1 || (this.size & (this.size - 1)) !== 0)
    throw new Error('FFT size must be a power of two and bigger than 1');

  this._csize = size << 1;

  // NOTE: Use of `var` is intentional for old V8 versions
  var table = new Array(this.size * 2);
  for (var i = 0; i < table.length; i += 2) {
    const angle = Math.PI * i / this.size;
    table[i] = Math.cos(angle);
    table[i + 1] = -Math.sin(angle);
  }
  this.table = table;

  // Find size's power of two
  var power = 0;
  for (var t = 1; this.size > t; t <<= 1)
    power++;

  // Calculate initial step's width:
  //   * If we are full radix-4 - it is 2x smaller to give inital len=8
  //   * Otherwise it is the same as `power` to give len=4
  this._width = power % 2 === 0 ? power - 1 : power;

  // Pre-compute bit-reversal patterns
  this._bitrev = new Array(1 << this._width);
  for (var j = 0; j < this._bitrev.length; j++) {
    this._bitrev[j] = 0;
    for (var shift = 0; shift < this._width; shift += 2) {
      var revShift = this._width - shift - 2;
      this._bitrev[j] |= ((j >>> shift) & 3) << revShift;
    }
  }

  this._out = null;
  this._data = null;
  this._inv = 0;
}
var fft = FFT;

FFT.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
  var res = storage || new Array(complex.length >>> 1);
  for (var i = 0; i < complex.length; i += 2)
    res[i >>> 1] = complex[i];
  return res;
};

FFT.prototype.createComplexArray = function createComplexArray() {
  const res = new Array(this._csize);
  for (var i = 0; i < res.length; i++)
    res[i] = 0;
  return res;
};

FFT.prototype.toComplexArray = function toComplexArray(input, storage) {
  var res = storage || this.createComplexArray();
  for (var i = 0; i < res.length; i += 2) {
    res[i] = input[i >>> 1];
    res[i + 1] = 0;
  }
  return res;
};

FFT.prototype.completeSpectrum = function completeSpectrum(spectrum) {
  var size = this._csize;
  var half = size >>> 1;
  for (var i = 2; i < half; i += 2) {
    spectrum[size - i] = spectrum[i];
    spectrum[size - i + 1] = -spectrum[i + 1];
  }
};

FFT.prototype.transform = function transform(out, data) {
  if (out === data)
    throw new Error('Input and output buffers must be different');

  this._out = out;
  this._data = data;
  this._inv = 0;
  this._transform4();
  this._out = null;
  this._data = null;
};

FFT.prototype.realTransform = function realTransform(out, data) {
  if (out === data)
    throw new Error('Input and output buffers must be different');

  this._out = out;
  this._data = data;
  this._inv = 0;
  this._realTransform4();
  this._out = null;
  this._data = null;
};

FFT.prototype.inverseTransform = function inverseTransform(out, data) {
  if (out === data)
    throw new Error('Input and output buffers must be different');

  this._out = out;
  this._data = data;
  this._inv = 1;
  this._transform4();
  for (var i = 0; i < out.length; i++)
    out[i] /= this.size;
  this._out = null;
  this._data = null;
};

// radix-4 implementation
//
// NOTE: Uses of `var` are intentional for older V8 version that do not
// support both `let compound assignments` and `const phi`
FFT.prototype._transform4 = function _transform4() {
  var out = this._out;
  var size = this._csize;

  // Initial step (permute and transform)
  var width = this._width;
  var step = 1 << width;
  var len = (size / step) << 1;

  var outOff;
  var t;
  var bitrev = this._bitrev;
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleTransform2(outOff, off, step);
    }
  } else {
    // len === 8
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleTransform4(outOff, off, step);
    }
  }

  // Loop through steps in decreasing order
  var inv = this._inv ? -1 : 1;
  var table = this.table;
  for (step >>= 2; step >= 2; step >>= 2) {
    len = (size / step) << 1;
    var quarterLen = len >>> 2;

    // Loop through offsets in the data
    for (outOff = 0; outOff < size; outOff += len) {
      // Full case
      var limit = outOff + quarterLen;
      for (var i = outOff, k = 0; i < limit; i += 2, k += step) {
        const A = i;
        const B = A + quarterLen;
        const C = B + quarterLen;
        const D = C + quarterLen;

        // Original values
        const Ar = out[A];
        const Ai = out[A + 1];
        const Br = out[B];
        const Bi = out[B + 1];
        const Cr = out[C];
        const Ci = out[C + 1];
        const Dr = out[D];
        const Di = out[D + 1];

        // Middle values
        const MAr = Ar;
        const MAi = Ai;

        const tableBr = table[k];
        const tableBi = inv * table[k + 1];
        const MBr = Br * tableBr - Bi * tableBi;
        const MBi = Br * tableBi + Bi * tableBr;

        const tableCr = table[2 * k];
        const tableCi = inv * table[2 * k + 1];
        const MCr = Cr * tableCr - Ci * tableCi;
        const MCi = Cr * tableCi + Ci * tableCr;

        const tableDr = table[3 * k];
        const tableDi = inv * table[3 * k + 1];
        const MDr = Dr * tableDr - Di * tableDi;
        const MDi = Dr * tableDi + Di * tableDr;

        // Pre-Final values
        const T0r = MAr + MCr;
        const T0i = MAi + MCi;
        const T1r = MAr - MCr;
        const T1i = MAi - MCi;
        const T2r = MBr + MDr;
        const T2i = MBi + MDi;
        const T3r = inv * (MBr - MDr);
        const T3i = inv * (MBi - MDi);

        // Final values
        const FAr = T0r + T2r;
        const FAi = T0i + T2i;

        const FCr = T0r - T2r;
        const FCi = T0i - T2i;

        const FBr = T1r + T3i;
        const FBi = T1i - T3r;

        const FDr = T1r - T3i;
        const FDi = T1i + T3r;

        out[A] = FAr;
        out[A + 1] = FAi;
        out[B] = FBr;
        out[B + 1] = FBi;
        out[C] = FCr;
        out[C + 1] = FCi;
        out[D] = FDr;
        out[D + 1] = FDi;
      }
    }
  }
};

// radix-2 implementation
//
// NOTE: Only called for len=4
FFT.prototype._singleTransform2 = function _singleTransform2(outOff, off,
                                                             step) {
  const out = this._out;
  const data = this._data;

  const evenR = data[off];
  const evenI = data[off + 1];
  const oddR = data[off + step];
  const oddI = data[off + step + 1];

  const leftR = evenR + oddR;
  const leftI = evenI + oddI;
  const rightR = evenR - oddR;
  const rightI = evenI - oddI;

  out[outOff] = leftR;
  out[outOff + 1] = leftI;
  out[outOff + 2] = rightR;
  out[outOff + 3] = rightI;
};

// radix-4
//
// NOTE: Only called for len=8
FFT.prototype._singleTransform4 = function _singleTransform4(outOff, off,
                                                             step) {
  const out = this._out;
  const data = this._data;
  const inv = this._inv ? -1 : 1;
  const step2 = step * 2;
  const step3 = step * 3;

  // Original values
  const Ar = data[off];
  const Ai = data[off + 1];
  const Br = data[off + step];
  const Bi = data[off + step + 1];
  const Cr = data[off + step2];
  const Ci = data[off + step2 + 1];
  const Dr = data[off + step3];
  const Di = data[off + step3 + 1];

  // Pre-Final values
  const T0r = Ar + Cr;
  const T0i = Ai + Ci;
  const T1r = Ar - Cr;
  const T1i = Ai - Ci;
  const T2r = Br + Dr;
  const T2i = Bi + Di;
  const T3r = inv * (Br - Dr);
  const T3i = inv * (Bi - Di);

  // Final values
  const FAr = T0r + T2r;
  const FAi = T0i + T2i;

  const FBr = T1r + T3i;
  const FBi = T1i - T3r;

  const FCr = T0r - T2r;
  const FCi = T0i - T2i;

  const FDr = T1r - T3i;
  const FDi = T1i + T3r;

  out[outOff] = FAr;
  out[outOff + 1] = FAi;
  out[outOff + 2] = FBr;
  out[outOff + 3] = FBi;
  out[outOff + 4] = FCr;
  out[outOff + 5] = FCi;
  out[outOff + 6] = FDr;
  out[outOff + 7] = FDi;
};

// Real input radix-4 implementation
FFT.prototype._realTransform4 = function _realTransform4() {
  var out = this._out;
  var size = this._csize;

  // Initial step (permute and transform)
  var width = this._width;
  var step = 1 << width;
  var len = (size / step) << 1;

  var outOff;
  var t;
  var bitrev = this._bitrev;
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
    }
  } else {
    // len === 8
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
    }
  }

  // Loop through steps in decreasing order
  var inv = this._inv ? -1 : 1;
  var table = this.table;
  for (step >>= 2; step >= 2; step >>= 2) {
    len = (size / step) << 1;
    var halfLen = len >>> 1;
    var quarterLen = halfLen >>> 1;
    var hquarterLen = quarterLen >>> 1;

    // Loop through offsets in the data
    for (outOff = 0; outOff < size; outOff += len) {
      for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
        var A = outOff + i;
        var B = A + quarterLen;
        var C = B + quarterLen;
        var D = C + quarterLen;

        // Original values
        var Ar = out[A];
        var Ai = out[A + 1];
        var Br = out[B];
        var Bi = out[B + 1];
        var Cr = out[C];
        var Ci = out[C + 1];
        var Dr = out[D];
        var Di = out[D + 1];

        // Middle values
        var MAr = Ar;
        var MAi = Ai;

        var tableBr = table[k];
        var tableBi = inv * table[k + 1];
        var MBr = Br * tableBr - Bi * tableBi;
        var MBi = Br * tableBi + Bi * tableBr;

        var tableCr = table[2 * k];
        var tableCi = inv * table[2 * k + 1];
        var MCr = Cr * tableCr - Ci * tableCi;
        var MCi = Cr * tableCi + Ci * tableCr;

        var tableDr = table[3 * k];
        var tableDi = inv * table[3 * k + 1];
        var MDr = Dr * tableDr - Di * tableDi;
        var MDi = Dr * tableDi + Di * tableDr;

        // Pre-Final values
        var T0r = MAr + MCr;
        var T0i = MAi + MCi;
        var T1r = MAr - MCr;
        var T1i = MAi - MCi;
        var T2r = MBr + MDr;
        var T2i = MBi + MDi;
        var T3r = inv * (MBr - MDr);
        var T3i = inv * (MBi - MDi);

        // Final values
        var FAr = T0r + T2r;
        var FAi = T0i + T2i;

        var FBr = T1r + T3i;
        var FBi = T1i - T3r;

        out[A] = FAr;
        out[A + 1] = FAi;
        out[B] = FBr;
        out[B + 1] = FBi;

        // Output final middle point
        if (i === 0) {
          var FCr = T0r - T2r;
          var FCi = T0i - T2i;
          out[C] = FCr;
          out[C + 1] = FCi;
          continue;
        }

        // Do not overwrite ourselves
        if (i === hquarterLen)
          continue;

        // In the flipped case:
        // MAi = -MAi
        // MBr=-MBi, MBi=-MBr
        // MCr=-MCr
        // MDr=MDi, MDi=MDr
        var ST0r = T1r;
        var ST0i = -T1i;
        var ST1r = T0r;
        var ST1i = -T0i;
        var ST2r = -inv * T3i;
        var ST2i = -inv * T3r;
        var ST3r = -inv * T2i;
        var ST3i = -inv * T2r;

        var SFAr = ST0r + ST2r;
        var SFAi = ST0i + ST2i;

        var SFBr = ST1r + ST3i;
        var SFBi = ST1i - ST3r;

        var SA = outOff + quarterLen - i;
        var SB = outOff + halfLen - i;

        out[SA] = SFAr;
        out[SA + 1] = SFAi;
        out[SB] = SFBr;
        out[SB + 1] = SFBi;
      }
    }
  }
};

// radix-2 implementation
//
// NOTE: Only called for len=4
FFT.prototype._singleRealTransform2 = function _singleRealTransform2(outOff,
                                                                     off,
                                                                     step) {
  const out = this._out;
  const data = this._data;

  const evenR = data[off];
  const oddR = data[off + step];

  const leftR = evenR + oddR;
  const rightR = evenR - oddR;

  out[outOff] = leftR;
  out[outOff + 1] = 0;
  out[outOff + 2] = rightR;
  out[outOff + 3] = 0;
};

// radix-4
//
// NOTE: Only called for len=8
FFT.prototype._singleRealTransform4 = function _singleRealTransform4(outOff,
                                                                     off,
                                                                     step) {
  const out = this._out;
  const data = this._data;
  const inv = this._inv ? -1 : 1;
  const step2 = step * 2;
  const step3 = step * 3;

  // Original values
  const Ar = data[off];
  const Br = data[off + step];
  const Cr = data[off + step2];
  const Dr = data[off + step3];

  // Pre-Final values
  const T0r = Ar + Cr;
  const T1r = Ar - Cr;
  const T2r = Br + Dr;
  const T3r = inv * (Br - Dr);

  // Final values
  const FAr = T0r + T2r;

  const FBr = T1r;
  const FBi = -T3r;

  const FCr = T0r - T2r;

  const FDr = T1r;
  const FDi = T3r;

  out[outOff] = FAr;
  out[outOff + 1] = 0;
  out[outOff + 2] = FBr;
  out[outOff + 3] = FBi;
  out[outOff + 4] = FCr;
  out[outOff + 5] = 0;
  out[outOff + 6] = FDr;
  out[outOff + 7] = FDi;
};

var FFT$1 = /*@__PURE__*/getDefaultExportFromCjs(fft);

class SpectralSlice {
    _peakBin = null;
    _peakF = null;
    _spec = null;
    _signal;
    _fs;
    _fftSize;
    _searchRangeHz;
    constructor(signal, fs, searchRangeHz) {
        this._signal = signal;
        this._fs = fs;
        this._fftSize = signal.length;
        this._searchRangeHz = searchRangeHz;
    }
    get signal() {
        return this._signal;
    }
    set signal(value) {
        this._signal = value;
        this._peakBin = null;
        this._peakF = null;
        this._spec = null;
    }
    get fs() {
        return this._fs;
    }
    set fs(value) {
        this._fs = value;
        this._peakBin = null;
        this._peakF = null;
        this._spec = null;
    }
    get fftSize() {
        return this._fftSize;
    }
    set fftSize(value) {
        this._fftSize = value;
        this._peakBin = null;
        this._peakF = null;
        this._spec = null;
    }
    get spec() {
        if (this._spec === null) {
            const fft = new FFT$1(this._fftSize);
            const out = fft.createComplexArray();
            fft.realTransform(out, this._signal);
            const fftData = new Float32Array(out);
            const magnitudes = new Float32Array(fftData.length / 2);
            for (let i = 0; i < fftData.length; i += 2) {
                const real = fftData[i];
                const imag = fftData[i + 1];
                magnitudes[i / 2] = Math.sqrt(real * real + imag * imag);
            }
            this._spec = magnitudes.map((x) => Math.log10(x));
        }
        return this._spec;
    }
    get peakBin() {
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
    get peakF() {
        if (this._peakF === null) {
            // Skip interpolation at the spectrum edges; there are no adjacent bins.
            if (this.peakBin <= 0 || this.peakBin >= this.spec.length - 1) {
                this._peakF = (this.fs * this.peakBin) / this.fftSize;
            }
            else {
                const offset = this.calculateBinOffset(this.spec.slice(this.peakBin - 1, this.peakBin + 2));
                const safeOffset = Number.isFinite(offset)
                    ? Math.max(-0.5, Math.min(0.5, offset))
                    : 0;
                this._peakF = (this.fs * (this.peakBin + safeOffset)) / this.fftSize;
            }
        }
        return this._peakF;
    }
    // Uses quadratic interpolation to estimate offset of peaks that fall between FFT bins
    calculateBinOffset(bins) {
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

class InternMap extends Map {
  constructor(entries, key = keyof) {
    super();
    Object.defineProperties(this, {_intern: {value: new Map()}, _key: {value: key}});
    if (entries != null) for (const [key, value] of entries) this.set(key, value);
  }
  get(key) {
    return super.get(intern_get(this, key));
  }
  has(key) {
    return super.has(intern_get(this, key));
  }
  set(key, value) {
    return super.set(intern_set(this, key), value);
  }
  delete(key) {
    return super.delete(intern_delete(this, key));
  }
}

function intern_get({_intern, _key}, value) {
  const key = _key(value);
  return _intern.has(key) ? _intern.get(key) : value;
}

function intern_set({_intern, _key}, value) {
  const key = _key(value);
  if (_intern.has(key)) return _intern.get(key);
  _intern.set(key, value);
  return value;
}

function intern_delete({_intern, _key}, value) {
  const key = _key(value);
  if (_intern.has(key)) {
    value = _intern.get(key);
    _intern.delete(key);
  }
  return value;
}

function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

function mode(values, valueof) {
  const counts = new InternMap();
  {
    for (let value of values) {
      if (value != null && value >= value) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    }
  }
  let modeValue;
  let modeCount = 0;
  for (const [value, count] of counts) {
    if (count > modeCount) {
      modeCount = count;
      modeValue = value;
    }
  }
  return modeValue;
}

class PitchTrack {
    audioData;
    fftSize;
    hopSize;
    searchRangeHz;
    bufferLength;
    _result = null;
    constructor(audioData, fftSize = 2048, hopSize = 1024, searchRangeHz) {
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
    peakF(values) {
        return mode(values.map((x) => Math.round(x)));
    }
    maxAmp(arrays) {
        return arrays.reduce((max, currentArray) => {
            const currentMax = Math.max(...currentArray);
            return Math.max(max, currentMax);
        }, -Infinity);
    }
    median(values) {
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
            const numFrames = Math.floor((this.bufferLength - this.fftSize) / this.hopSize) + 1;
            const t = new Array(numFrames);
            const f = new Array(numFrames);
            const stft = new Array(numFrames);
            const window = this.hanningWindow();
            const pcmBuffer = this.audioData.channels[0];
            for (let i = 0; i < numFrames; i++) {
                const start = i * this.hopSize;
                const frame = new Float32Array(this.fftSize);
                // Apply window to frame
                for (let j = 0; j < this.fftSize; j++) {
                    frame[j] = pcmBuffer[start + j] * window[j];
                }
                const specSlice = new SpectralSlice(frame, this.audioData.fs, this.searchRangeHz);
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
    hanningWindow() {
        const window = new Float32Array(this.fftSize);
        for (let i = 0; i < this.fftSize; i++) {
            window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (this.fftSize - 1));
        }
        return window;
    }
}

const hanningWindow = (size) => {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return window;
};
const maxAmp = (arrays) => {
    return arrays.reduce((max, currentArray) => {
        const currentMax = Math.max(...currentArray);
        return Math.max(max, currentMax);
    }, -Infinity);
};
const computeSpectrogram = (audioData, fftSize = 2048, hopSize = 1024) => {
    if (!audioData.channels.length) {
        throw new Error('AudioData must include at least one channel.');
    }
    const pcmBuffer = audioData.channels[0];
    const numFrames = Math.floor((pcmBuffer.length - fftSize) / hopSize) + 1;
    if (numFrames <= 0) {
        throw new Error(`Input signal is shorter than fft_size (${fftSize}) and cannot form a frame.`);
    }
    const specs = new Array(numFrames);
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

class AudioData {
    channels;
    fs;
    constructor(channels, fs) {
        if (!channels.length) {
            throw new Error('At least one channel must be provided.');
        }
        if (channels.length > 1) {
            if (!channels.every((subArray) => subArray.length === channels[0].length)) {
                throw new Error('All channels must be the same length');
            }
        }
        this.channels = channels;
        this.fs = fs;
    }
    multiply() {
        if (this.channels.length != 2) {
            throw new Error('multiply method requires 2 (and only 2) channels');
        }
        const mix = new Float32Array(this.channels[0].length);
        for (let i = 0; i < mix.length; i++) {
            mix[i] = this.channels[0][i] * this.channels[1][i];
        }
        return mix;
    }
    toAudioBuffer(context) {
        const audioBuffer = context.createBuffer(this.channels.length, this.channels[0].length, context.sampleRate);
        this.channels.forEach((channelData, index) => {
            const channel = channelData.buffer instanceof ArrayBuffer
                ? channelData
                : new Float32Array(channelData);
            audioBuffer.copyToChannel(channel, index);
        });
        return audioBuffer;
    }
}

const ensureArrayBufferView = (data) => data.buffer instanceof ArrayBuffer
    ? data
    : new Float32Array(data);
class AudioDataSource {
    _audioBuffer = null;
    audioData;
    audioContext;
    constructor(context, source) {
        this.audioContext = context;
        this.audioData = source;
    }
    getAudioBuffer() {
        if (this._audioBuffer === null) {
            this._audioBuffer = this.audioContext.createBuffer(this.audioData.channels.length, this.audioData.channels[0].length, this.audioData.fs);
            this.audioData.channels.forEach((channelData, index) => {
                this._audioBuffer.copyToChannel(ensureArrayBufferView(channelData), index);
            });
        }
        return this._audioBuffer;
    }
}

class LoopbackRecording {
    audioData;
    metaData;
    constructor(audioData, metaData) {
        this.audioData = audioData;
        this.metaData = metaData;
    }
    getWAV() {
        const wav = new WaveFile();
        wav.fromScratch(this.audioData.channels.length, this.audioData.fs, '32f', this.audioData.channels);
        wav.setTag('IART', this.metaData.userAgent);
        wav.setTag('ICMT', this.metaData.id);
        return wav;
    }
    async postWAV(endpoint) {
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

class LoopbackRuntime {
    audioContext;
    timing;
    fs;
    generateUniqueId;
    saveWAV;
    recorderWorkletName = 'recorder-worklet';
    recorderWorkletUrl;
    loadedRecorderWorkletUrl = null;
    stream = null;
    pcmBuffer = null;
    constructor(audioContext, timing, fs, generateUniqueId, saveWAV, options = {}) {
        this.audioContext = audioContext;
        this.timing = timing;
        this.fs = fs;
        this.generateUniqueId = generateUniqueId;
        this.saveWAV = saveWAV;
        this.recorderWorkletUrl =
            options.recorderWorkletUrl ||
                new URL('./worklets/recorder-worklet.js', import.meta.url).href;
    }
    getPCMBuffer() {
        return this.pcmBuffer;
    }
    getRecorderWorkletUrl() {
        return this.recorderWorkletUrl;
    }
    setRecorderWorkletUrl(url) {
        this.recorderWorkletUrl = url;
        this.loadedRecorderWorkletUrl = null;
    }
    async loadAudioBuffer(filePath) {
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        return this.audioContext.decodeAudioData(arrayBuffer);
    }
    async prepareAudioBuffer(source) {
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
    async play(source, delay = 0) {
        try {
            await this.ensureAudioContextRunning();
            const buffer = await this.prepareAudioBuffer(source);
            const audioSource = this.audioContext.createBufferSource();
            audioSource.buffer = buffer;
            audioSource.connect(this.audioContext.destination);
            this.timing.setStartTime(delay);
            audioSource.start(this.timing.startTime);
        }
        catch (error) {
            console.error('Error during playback:', error);
            throw error;
        }
    }
    async requestMicrophoneAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted.');
            stream.getTracks().forEach((track) => track.stop());
            this.stream = stream;
        }
        catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }
    async prepareMicStream() {
        if (!this.stream ||
            this.stream.getTracks().every((track) => track.readyState === 'ended')) {
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
    async record(delay = 0, duration = 1) {
        await this.ensureAudioContextRunning();
        await this.prepareMicStream();
        await this.ensureRecorderWorkletLoaded();
        const mediaStreamNode = this.audioContext.createMediaStreamSource(this.stream);
        const micProcessor = new AudioWorkletNode(this.audioContext, this.recorderWorkletName, {
            processorOptions: { numChannels: 1 },
        });
        mediaStreamNode.connect(micProcessor);
        this.timing.setStartTime(delay);
        const startTime = this.timing.startTime;
        const endTime = startTime + duration;
        const param = micProcessor.parameters.get('isRecording');
        if (param) {
            param.setValueAtTime(1, this.timing.startTime);
            param.setValueAtTime(0, endTime);
        }
        else {
            throw new Error('Parameter "isRecording" is not found on the AudioWorkletNode.');
        }
        const id = this.generateUniqueId();
        const pcmChunks = [];
        const result = new Promise((resolve) => {
            micProcessor.port.onmessage = (event) => {
                if (event.data.eventType === 'data') {
                    const channelData = event.data.audioBuffer?.[0];
                    if (channelData instanceof Float32Array) {
                        pcmChunks.push(new Float32Array(channelData));
                    }
                    else if (Array.isArray(channelData)) {
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
        const session = {
            id,
            startTime,
            endTime,
            stopAt: (contextTime) => {
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
    createBufferFromPCM(pcmData, sampleRate = this.fs) {
        const pcm = pcmData instanceof Float32Array ? pcmData : Float32Array.from(pcmData);
        const buffer = this.audioContext.createBuffer(1, pcm.length, sampleRate);
        const pcmChannel = pcm.buffer instanceof ArrayBuffer
            ? pcm
            : new Float32Array(pcm);
        buffer.copyToChannel(pcmChannel, 0, 0);
        return buffer;
    }
    mergeChunks(chunks) {
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }
        return merged;
    }
    async prepareAudioSource(source) {
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
    async virtualLoopback(source, options) {
        try {
            const timings = {
                callPerformanceTime: performance.now(),
            };
            await this.ensureAudioContextRunning();
            await this.prepareMicStream();
            timings.afterMicTime = performance.now();
            const mediaStreamNode = this.audioContext.createMediaStreamSource(this.stream);
            const buffer = await this.prepareAudioBuffer(source);
            timings.afterBufferTime = performance.now();
            const audioSource = this.audioContext.createBufferSource();
            audioSource.buffer = buffer;
            await this.ensureRecorderWorkletLoaded();
            timings.afterWorkletTime = performance.now();
            const recorder = new AudioWorkletNode(this.audioContext, this.recorderWorkletName, {
                processorOptions: { numChannels: 2 },
            });
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
            recorder.parameters.get('isRecording').setValueAtTime(1, startTime);
            recorder.parameters.get('isRecording').setValueAtTime(0, endTime);
            const pcmMic = [];
            const pcmStim = [];
            return new Promise((resolve, reject) => {
                recorder.port.onmessage = (event) => {
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
                        }
                        catch (error) {
                            console.error(`Error processing PCM data: ${error}`);
                            reject(error);
                        }
                    }
                };
            });
        }
        catch (error) {
            console.error('Error in virtualLoopback:', error);
            throw error;
        }
    }
    async ensureRecorderWorkletLoaded() {
        if (this.loadedRecorderWorkletUrl === this.recorderWorkletUrl) {
            return;
        }
        await this.audioContext.audioWorklet.addModule(this.recorderWorkletUrl);
        this.loadedRecorderWorkletUrl = this.recorderWorkletUrl;
    }
    async ensureAudioContextRunning() {
        if (this.audioContext.state !== 'running') {
            await this.audioContext.resume();
        }
    }
    resolveLoopbackWindow(options) {
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
            ? options.startTime
            : this.timing.setStartTime(options.delay);
        let endTime = hasEnd ? options.endTime : startTime + options.duration;
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
            throw new Error('virtualLoopback timing options must be finite numbers.');
        }
        if (startTime <= now + minLeadTime) {
            console.warn(`virtualLoopback startTime (${startTime.toFixed(4)}) is too close to now ` +
                `(${now.toFixed(4)}). Clamping to ${minLeadTime}s in the future.`);
            // TODO: Decide on strategy when requested startTime is in the past:
            // (A) preserve intended duration, or (B) preserve endTime if in future.
            const impliedDuration = hasEnd ? endTime - startTime : options.duration;
            startTime = now + minLeadTime;
            if (!hasEnd) {
                endTime = startTime + impliedDuration;
            }
        }
        return { startTime, endTime };
    }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const drawOverlay = (ctx, overlay, spectrogram, width, height) => {
    const numFrames = spectrogram.specs.length;
    if (numFrames === 0 || overlay.f.length === 0) {
        return;
    }
    const maxFrequencyBin = spectrogram.fft_size / 2;
    const pixelsPerBin = Math.max(1, Math.floor(height / maxFrequencyBin));
    const totalDurationS = ((numFrames - 1) * spectrogram.hop_size) / spectrogram.fs;
    const overlayOffsetS = overlay.timeOffsetS ?? 0;
    ctx.strokeStyle = overlay.color ?? 'red';
    ctx.lineWidth = overlay.lineWidth ?? 2;
    ctx.beginPath();
    for (let i = 0; i < overlay.f.length; i++) {
        const frequency = overlay.f[i];
        if (!Number.isFinite(frequency)) {
            continue;
        }
        let x;
        if (overlay.t && overlay.t.length === overlay.f.length) {
            const normalisedT = totalDurationS > 0
                ? (overlay.t[i] + overlayOffsetS) / totalDurationS
                : 0;
            x = normalisedT * width;
        }
        else {
            x = (i / Math.max(overlay.f.length - 1, 1)) * width;
        }
        const peakBin = (frequency * spectrogram.fft_size) / spectrogram.fs;
        const y = height - peakBin * pixelsPerBin;
        const xClamped = clamp(x, 0, width);
        const yClamped = clamp(y, 0, height);
        if (i === 0) {
            ctx.moveTo(xClamped, yClamped);
        }
        else {
            ctx.lineTo(xClamped, yClamped);
        }
    }
    ctx.stroke();
};
const plotSpectrogram = ({ canvas, width, height, spectrogram, overlays = [], }) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Unable to get canvas context');
        return;
    }
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    const numFrames = spectrogram.specs.length;
    const pixelsPerFrame = Math.max(1, Math.floor(width / Math.max(numFrames, 1)));
    const maxFrequencyBin = spectrogram.fft_size / 2;
    const pixelsPerBin = Math.max(1, Math.floor(height / maxFrequencyBin));
    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
        const frame = spectrogram.specs[frameIndex];
        for (let bin = 0; bin < maxFrequencyBin; bin++) {
            const magnitude = frame[bin];
            const normalisedMagnitude = (1 + magnitude) / spectrogram.max_amp;
            const colourIntensity = clamp(Math.floor(255 * normalisedMagnitude), 0, 255);
            ctx.fillStyle = `rgb(${colourIntensity}, ${colourIntensity}, ${colourIntensity})`;
            ctx.fillRect(frameIndex * pixelsPerFrame, height - (bin + 1) * pixelsPerBin, pixelsPerFrame, pixelsPerBin);
        }
    }
    overlays.forEach((overlay) => drawOverlay(ctx, overlay, spectrogram, width, height));
};
const plotPitchTrackValidation = (pitchTrackData, canvas, width, height, fs) => {
    const spectrogram = {
        specs: pitchTrackData.specs,
        fft_size: pitchTrackData.fft_size,
        hop_size: pitchTrackData.hop_size,
        fs,
        max_amp: pitchTrackData.max_amp,
    };
    plotSpectrogram({
        canvas,
        width,
        height,
        spectrogram,
        overlays: [{ f: pitchTrackData.f, t: pitchTrackData.t, color: 'red' }],
    });
};

class AudioTiming {
    audioContext;
    _pStartTime = 0;
    _startTime = 0;
    constructor(audioContext) {
        this.audioContext = audioContext;
    }
    get startTime() {
        return this._startTime;
    }
    getTimestamp() {
        return this.audioContext.getOutputTimestamp();
    }
    async getLag() {
        const ts = await this.audioContext.getOutputTimestamp();
        if (this.checkTimestampRatio()) {
            if (typeof ts.performanceTime !== 'undefined' &&
                typeof ts.contextTime !== 'undefined') {
                ts.contextTime = ts.contextTime * 1000;
                const lag = ts.performanceTime -
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
    async scheduleAnimationFrame(time) {
        console.log(`This is an unimplemented method that takes time (${time}) as an argument`);
    }
    // Convert time relative to startTime to performance time
    convertTime(time) {
        const ts = this.audioContext.getOutputTimestamp();
        if (this.checkTimestampRatio()) {
            if (typeof ts.performanceTime !== 'undefined' &&
                typeof ts.contextTime !== 'undefined') {
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
    checkTimestampRatio(threshold = 10) {
        const ts = this.audioContext.getOutputTimestamp();
        const currentTime = this.audioContext.currentTime;
        // Ensure both performanceTime and contextTime are defined
        if (typeof ts.performanceTime === 'undefined' ||
            typeof ts.contextTime === 'undefined') {
            throw new Error('Timestamp data is incomplete.');
        }
        const ratioDetails = `currentTime: ${currentTime} | contextTime: ${ts.contextTime} | ` +
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
            throw new Error(`Detected potential Safari timestamp issue. ${ratioDetails}`);
        }
        // If neither condition is met, throw a general error
        throw new Error(`Unknown timestamp ratio issue detected. ${ratioDetails}`);
    }
    setStartTime(delay = 0) {
        const ts = this.getTimestamp();
        if (typeof ts.performanceTime !== 'undefined' &&
            typeof ts.contextTime !== 'undefined') {
            this._startTime = ts.contextTime + delay;
            this._pStartTime = ts.performanceTime + 1000 * delay;
            return this._startTime;
        }
        return 0;
    }
}

// AuditoryToolbox.ts
// Import the entire package
class AuditoryToolbox {
    audioContext;
    fs;
    timing;
    loopback;
    wavBlobs;
    constructor(audioContext, options = {}) {
        this.audioContext = audioContext || new AudioContext();
        this.fs = this.audioContext.sampleRate;
        this.timing = new AudioTiming(this.audioContext);
        this.wavBlobs = new Map();
        this.loopback = new LoopbackRuntime(this.audioContext, this.timing, this.fs, () => this.generateUniqueId(), (id, pcmBuffer) => this.saveWAV(id, pcmBuffer), { recorderWorkletUrl: options.recorderWorkletUrl });
    }
    getRecorderWorkletUrl() {
        return this.loopback.getRecorderWorkletUrl();
    }
    setRecorderWorkletUrl(url) {
        this.loopback.setRecorderWorkletUrl(url);
    }
    plotSpectrogram(pitchTrackOrConfig, canvas, width, height) {
        if (typeof HTMLCanvasElement !== 'undefined' &&
            canvas instanceof HTMLCanvasElement &&
            typeof width === 'number' &&
            typeof height === 'number') {
            return this.plotPitchTrackValidation(pitchTrackOrConfig, canvas, width, height);
        }
        const config = pitchTrackOrConfig;
        const spectrogram = config.spectrogram ||
            (config.audioData
                ? this.createSpectrogramData(config.audioData, config.fft_size, config.hop_size)
                : null);
        if (!spectrogram) {
            throw new Error('plotSpectrogram requires spectrogram data or audioData.');
        }
        return plotSpectrogram({
            ...config,
            spectrogram,
        });
    }
    plotPitchTrackValidation(pitchTrackData, canvas, width, height) {
        return plotPitchTrackValidation(pitchTrackData, canvas, width, height, this.fs);
    }
    createSpectrogramData(audioData, fft_size = 2048, hop_size = 1024) {
        return computeSpectrogram(audioData, fft_size, hop_size);
    }
    calculateMagnitudes(fftData) {
        const magnitudes = new Float32Array(fftData.length / 2);
        for (let i = 0; i < fftData.length; i += 2) {
            const real = fftData[i];
            const imag = fftData[i + 1];
            magnitudes[i / 2] = Math.sqrt(real * real + imag * imag);
        }
        return magnitudes;
    }
    // For quadratic interpolation of frequency from peak and adjacent bins
    calculateBinOffset(bins) {
        const a = bins[0];
        const b = bins[1];
        const c = bins[2];
        const p = (a - c) / (2 * (a - 2 * b + c));
        return p;
    }
    applyHanningWindow(buffer) {
        const windowedBuffer = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            windowedBuffer[i] =
                buffer[i] *
                    (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (buffer.length - 1)));
        }
        return windowedBuffer;
    }
    hann(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
        }
        return window;
    }
    downloadBlob(id) {
        const blob = this.wavBlobs.get(id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${id}.wav`;
        link.click();
        URL.revokeObjectURL(url);
    }
    async loadAudioBuffer(filePath) {
        return this.loopback.loadAudioBuffer(filePath);
    }
    async saveWAV(id, pcmBuffer) {
        const wav = audioBufferToWav$1(pcmBuffer);
        const blob = new window.Blob([new DataView(wav)], { type: 'audio/x-wav' });
        this.wavBlobs.set(id, blob);
    }
    async saveWAV2(id, pcmL, pcmR) {
        // const pcmLMerged = this.mergeChunks(pcmL);
        // const pcmRMerged = this.mergeChunks(pcmR);
        // stereo, 32-bit float
        const wav = new WaveFile();
        wav.fromScratch(2, this.fs, '32f', [pcmL, pcmR]);
        // Use the artist tag to store the user agent string
        wav.setTag('IART', navigator.userAgent);
        // Use comment tag for other metadata
        const commitHash = "5860aae";
        wav.setTag('ICMT', `commit: ${commitHash}`);
        const url = wav.toDataURI();
        const link = document.createElement('a');
        link.href = url;
        link.download = `${id}.wav`;
        link.click();
        URL.revokeObjectURL(url);
        return true;
    }
    async playPCM() {
        const pcmBuffer = this.loopback.getPCMBuffer();
        if (pcmBuffer) {
            this.play(pcmBuffer);
        }
        else {
            console.log('No PCM data');
        }
        console.log(pcmBuffer);
    }
    async prepareAudioBuffer(source) {
        return this.loopback.prepareAudioBuffer(source);
    }
    /**
     * @requiresUserGesture
     * @manualTestRequired
     */
    async play(source, delay = 0) {
        return this.loopback.play(source, delay);
    }
    /**
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    async requestMicrophoneAccess() {
        return this.loopback.requestMicrophoneAccess();
    }
    generateUniqueId() {
        return Math.random().toString(36).substring(2, 15);
    }
    /**
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    async prepareMicStream() {
        return this.loopback.prepareMicStream();
    }
    // Returns a session controller and stores the final recording in wavBlobs.
    /**
     * @requiresMicrophone
     * @requiresUserGesture
     * @manualTestRequired
     */
    async record(delay = 0, duration = 1) {
        return this.loopback.record(delay, duration);
    }
    // Need to adapt this to work with stereo AudioBuffers
    createBufferFromPCM(pcmData, sampleRate = this.fs) {
        return this.loopback.createBufferFromPCM(pcmData, sampleRate);
    }
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    getTimestamp() {
        return this.timing.getTimestamp();
    }
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    async getLag() {
        return this.timing.getLag();
    }
    // Convert time relative to startTime to performance time
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    convertTime(time) {
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
    checkTimestampRatio(threshold = 10) {
        return this.timing.checkTimestampRatio(threshold);
    }
    /**
     * Experimental: timestamp helpers are browser-specific and may change.
     */
    setStartTime(delay = 0) {
        return this.timing.setStartTime(delay);
    }
    /**
     * Experimental: convenience helper used in internal demos.
     * @requiresUserGesture
     * @manualTestRequired
     */
    async playChirp(max_f = 16000, delay = 0) {
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
    async createSineBuffer(min_f = 220, max_f = 440, dur = 2) {
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
            if (acc.length > 0)
                acc.push(acc[acc.length - 1] + val);
            else
                acc.push(val);
            return acc;
        }, []);
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
    async playSine(min_f = 220, max_f = 440, dur = 2) {
        const buffer = await this.createSineBuffer(min_f, max_f, dur);
        this.play(buffer);
    }
    async getOutputLatency() {
        return await this.audioContext.outputLatency;
    }
    mergeChunks(chunks) {
        return this.loopback.mergeChunks(chunks);
    }
    async prepareAudioSource(source) {
        return this.loopback.prepareAudioSource(source);
    }
    async saveLoopback(audioData, metaData, endpoint = '/save/loopback') {
        if (!metaData.id)
            throw new Error('No file ID provided');
        if (!metaData.signal)
            throw new Error('No signal reference provided');
        if (!metaData.userAgent)
            throw new Error('No userAgent provided');
        const loopbackRecording = new LoopbackRecording(audioData, metaData);
        try {
            const response = await loopbackRecording.postWAV(endpoint);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
        }
        catch (error) {
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
    async virtualLoopback(source, options) {
        return this.loopback.virtualLoopback(source, options);
    }
    // Frequency modulated continuous wave radar technique
    async fmcw(audioData, searchRangeHz) {
        if (typeof audioData === 'string') {
            const buffer = await this.prepareAudioBuffer(audioData);
            if (buffer.numberOfChannels < 2) {
                throw new Error('fmcw() requires a stereo signal. Use virtualLoopback() or provide a 2-channel AudioData.');
            }
            const pcmL = new Float32Array(buffer.length);
            const pcmR = new Float32Array(buffer.length);
            buffer.copyFromChannel(pcmL, 0);
            buffer.copyFromChannel(pcmR, 1);
            audioData = new AudioData([pcmL, pcmR], this.fs);
        }
        if (audioData.channels.length < 2) {
            throw new Error('fmcw() requires a stereo signal. Use virtualLoopback() or provide a 2-channel AudioData.');
        }
        const mix = new AudioData([audioData.multiply()], this.fs);
        const pitchTrack = new PitchTrack(mix, 2048, 1024, searchRangeHz);
        return pitchTrack.result;
    }
    // Using the AudioBuffer returned by virtualLoopback, perform latency test
    async latencyTest(source, searchRangeHz) {
        const buffer = typeof source === 'string'
            ? await this.prepareAudioBuffer(source)
            : source;
        const duration = buffer.duration;
        const audioData = await this.virtualLoopback(buffer, {
            delay: 0.1,
            duration,
        });
        return this.fmcw(audioData, searchRangeHz);
    }
    async detectPitch(source, searchRangeHz) {
        const buffer = await this.prepareAudioBuffer(source);
        const pcmBuffer = new Float32Array(buffer.length);
        buffer.copyFromChannel(pcmBuffer, 0);
        const audioData = new AudioData([pcmBuffer], this.fs);
        const pitchTrack = new PitchTrack(audioData, 2048, 1024, searchRangeHz);
        return pitchTrack.result;
    }
}

export { AudioData, AuditoryToolbox };
//# sourceMappingURL=index.js.map
