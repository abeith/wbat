import { AudioData, AuditoryToolbox } from '../../src/index';

const fakeContext = { sampleRate: 48000 } as AudioContext;
const auditory = new AuditoryToolbox(fakeContext);
const canvas = {} as HTMLCanvasElement;

const audioData = new AudioData([new Float32Array(4096)], 48000);
const spectrogram = auditory.createSpectrogramData(audioData, 512, 256);

// New config-style API should support spectrogram-only rendering.
auditory.plotSpectrogram({
  canvas,
  width: 800,
  height: 400,
  spectrogram,
});

// Config-style API should support direct AudioData input + overlays.
auditory.plotSpectrogram({
  canvas,
  width: 800,
  height: 400,
  audioData,
  overlays: [{ f: new Array(spectrogram.specs.length).fill(440) }],
});

// Legacy call signature should remain valid for backwards compatibility.
auditory.plotPitchTrackValidation(
  {
    t: [0, 1],
    f: [440, 441],
    median: 440.5,
    mode: 440,
    max_amp: 1,
    specs: spectrogram.specs,
    fft_size: spectrogram.fft_size,
    hop_size: spectrogram.hop_size,
  },
  canvas,
  800,
  400,
);
