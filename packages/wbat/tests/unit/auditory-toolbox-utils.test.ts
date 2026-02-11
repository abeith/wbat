import { AuditoryToolbox } from '../../src/index';

const makeAuditory = (): AuditoryToolbox => {
  const fakeContext = { sampleRate: 48000 } as AudioContext;
  return new AuditoryToolbox(fakeContext);
};

describe('AuditoryToolbox utility methods', () => {
  it('merges float chunks in order', () => {
    const auditory = makeAuditory();
    const merged = auditory.mergeChunks([
      new Float32Array([0.1, 0.2]),
      new Float32Array([0.3]),
      new Float32Array([0.4, 0.5]),
    ]);

    const expected = [0.1, 0.2, 0.3, 0.4, 0.5];
    expect(Array.from(merged)).toHaveLength(expected.length);
    expected.forEach((value, i) => {
      expect(merged[i]).toBeCloseTo(value, 6);
    });
  });

  it('calculates a center bin offset near zero', () => {
    const auditory = makeAuditory();
    const offset = auditory.calculateBinOffset(new Float32Array([0.5, 1, 0.5]));

    expect(offset).toBeCloseTo(0, 6);
  });

  it('generates ids that look random and non-empty', () => {
    const auditory = makeAuditory();
    const a = auditory.generateUniqueId();
    const b = auditory.generateUniqueId();

    expect(a).toMatch(/^[a-z0-9]+$/);
    expect(b).toMatch(/^[a-z0-9]+$/);
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});
