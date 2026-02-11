import { AudioData, AuditoryToolbox } from '../../src/index';

const makeAuditory = (): AuditoryToolbox => {
  const fakeContext = { sampleRate: 48000 } as AudioContext;
  return new AuditoryToolbox(fakeContext);
};

describe('saveLoopback validation', () => {
  const audioData = new AudioData([new Float32Array([0, 1, 0])], 48000);

  it('throws when id is missing', async () => {
    const auditory = makeAuditory();
    await expect(
      auditory.saveLoopback(audioData, {
        id: '',
        signal: 'chirp4',
        userAgent: 'test-agent',
      }),
    ).rejects.toThrow('No file ID provided');
  });

  it('throws when signal is missing', async () => {
    const auditory = makeAuditory();
    await expect(
      auditory.saveLoopback(audioData, {
        id: 'trial-1',
        signal: '',
        userAgent: 'test-agent',
      }),
    ).rejects.toThrow('No signal reference provided');
  });

  it('throws when userAgent is missing', async () => {
    const auditory = makeAuditory();
    await expect(
      auditory.saveLoopback(audioData, {
        id: 'trial-1',
        signal: 'chirp4',
        userAgent: '',
      }),
    ).rejects.toThrow('No userAgent provided');
  });
});
