import { AudioData, AuditoryToolbox } from '../../src/index';

const fakeContext = { sampleRate: 48000 } as AudioContext;
const auditory = new AuditoryToolbox(fakeContext);

const stereoData = new AudioData(
  [new Float32Array([0, 1, 0]), new Float32Array([1, 0, 1])],
  48000,
);

async function contractCheck() {
  const result = await auditory.fmcw(stereoData);

  const mode: number = result.mode;
  const frequencies: number[] = result.f;
  const spectrogram: Float32Array[] = result.specs;

  return { mode, frequencies, spectrogram };
}

// This call should remain valid as the API evolves.
void contractCheck();

// @ts-expect-error fmcw should not accept non-AudioData/non-string input
void auditory.fmcw(123);
