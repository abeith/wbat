import { AudioData } from '../../src/index';

describe('AudioData', () => {
  it('validates channel lengths', () => {
    expect(
      () =>
        new AudioData([new Float32Array([0, 1]), new Float32Array([0])], 48000),
    ).toThrow('All channels must be the same length');
  });

  it('multiplies stereo channels sample-wise', () => {
    const audio = new AudioData(
      [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])],
      48000,
    );

    expect(Array.from(audio.multiply())).toEqual([4, 10, 18]);
  });

  it('throws when multiply is called on non-stereo data', () => {
    const mono = new AudioData([new Float32Array([1, 2, 3])], 48000);
    expect(() => mono.multiply()).toThrow(
      'multiply method requires 2 (and only 2) channels',
    );
  });
});
