import { AuditoryToolbox } from '/auditoryToolbox/index.js';

const auditory = new AuditoryToolbox();
const testContainer = document.getElementById('test-container');
const runButtonA4 = document.getElementById('run_a4');
const runButtonChirp4Delay100 = document.getElementById('run_chirp4_delay100');
const results = document.getElementById('results');
const canvas = document.getElementById('spectrogramCanvas');
let unitTestValue = null;

const runA4 = async () => {
  let pitchTrack = await auditory.detectPitch('../sounds/a4.wav');
  console.log(pitchTrack);
  unitTestValue = pitchTrack.mode;
  window.unitTestValue = unitTestValue;
  results.innerText = `Actual pitch: 440Hz\nDetected pitch: ${Math.round(pitchTrack.mode * 100) / 100}Hz`;
  auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
};

const runChirp4Delay100 = async () => {
  let pitchTrack = await auditory.fmcw('../sounds/chirp4_delay100.wav');
  console.log(pitchTrack);
  const sweep = 4e3;
  const delay = 0.1;
  const delayEstimate = (1e3 * pitchTrack.mode) / sweep;
  unitTestValue = delayEstimate;
  window.unitTestValue = unitTestValue;
  results.innerText = `Actual delay: 100 ms\nDetected delay: ${delayEstimate} ms`;
  auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
};

runButtonA4.addEventListener('click', runA4);

runButtonChirp4Delay100.addEventListener('click', runChirp4Delay100);

export { unitTestValue };
