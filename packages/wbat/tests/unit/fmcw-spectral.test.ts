import { AudioData, AuditoryToolbox } from '../../src/index';

const fs = 48000;
const makeAuditory = (): AuditoryToolbox => {
  const fakeContext = { sampleRate: fs } as AudioContext;
  return new AuditoryToolbox(fakeContext);
};

const makeConstant = (value: number, length: number): Float32Array => {
  const out = new Float32Array(length);
  out.fill(value);
  return out;
};

const makeSine = (frequencyHz: number, length: number): Float32Array => {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = Math.sin((2 * Math.PI * frequencyHz * i) / fs);
  }
  return out;
};

const makeWeightedMixedSine = (
  frequenciesHz: number[],
  amplitudes: number[],
  length: number,
): Float32Array => {
  const out = new Float32Array(length);
  const amplitudeSum = amplitudes.reduce((sum, amp) => sum + amp, 0);
  for (let i = 0; i < length; i++) {
    let value = 0;
    for (let j = 0; j < frequenciesHz.length; j++) {
      const f = frequenciesHz[j];
      const a = amplitudes[j];
      value += a * Math.sin((2 * Math.PI * f * i) / fs);
    }
    out[i] = value / amplitudeSum;
  }
  return out;
};

describe('fmcw spectral behavior', () => {
  it('default search range avoids exact edge bins', async () => {
    const auditory = makeAuditory();
    const length = 4096;
    const constant = makeConstant(1, length);
    const audioData = new AudioData([constant, constant], fs);

    const result = await auditory.fmcw(audioData);

    expect(Number.isFinite(result.mode)).toBe(true);
    // By design, defaults should not return exact DC or exact Nyquist bins.
    expect(result.mode).toBeGreaterThan(0);
    expect(result.mode).toBeLessThan(fs / 2);
  });

  it('tracks a mid-spectrum sine with interpolation', async () => {
    const auditory = makeAuditory();
    const length = fs; // 1 second
    const targetHz = 1000;
    const sine = makeSine(targetHz, length);
    const unity = makeConstant(1, length);
    const audioData = new AudioData([sine, unity], fs);

    const result = await auditory.fmcw(audioData);

    expect(Number.isFinite(result.mode)).toBe(true);
    expect(Math.abs(result.mode - targetHz)).toBeLessThan(40);
  });

  it('supports constraining peak search with searchRangeHz', async () => {
    const auditory = makeAuditory();
    const length = fs; // 1 second
    const mixed = makeWeightedMixedSine([1000, 3000], [1, 0.25], length);
    const unity = makeConstant(1, length);
    const audioData = new AudioData([mixed, unity], fs);

    const fullRange = await auditory.fmcw(audioData);
    const constrained = await auditory.fmcw(audioData, [2000, 4000]);

    expect(Math.abs(fullRange.mode - 1000)).toBeLessThan(60);
    expect(Math.abs(constrained.mode - 3000)).toBeLessThan(60);
  });
});
