import { AuditoryToolbox } from '/auditoryToolbox/index.js';

const auditory = new AuditoryToolbox();
const testContainer = document.getElementById('test-container');
const runButton = document.getElementById('run');
const runSimButton = document.getElementById('run-sim');
const results = document.getElementById('results');
const canvas = document.getElementById('spectrogramCanvas');

const simulateLatencyTest = async () => {
  const params = new URLSearchParams(window.location.search);
  const sweep = params.get('sweep') || 4;
  const delay = params.get('delay') || 100;
  const pitchTrack = await auditory.fmcw(
    `../sounds/chirp${sweep}_delay${delay}.wav`,
  );
  const detectedDelay = pitchTrack.mode / sweep;
  window.unitTestValue = detectedDelay;
  results.innerText = `Delay: ${delay} ms\nDetected delay: ${detectedDelay} ms`;
  auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
};

const runLatencyTest = async () => {
    let pitchTrack = await auditory.latencyTest('../sounds/chirp4.wav');
  const median_freq = Math.round(pitchTrack.median * 100) / 100; //
  const chirp_sweep = 4e3;
  const delay = Math.round((100 * 1000 * pitchTrack.mode) / chirp_sweep) / 100; // Assumes a 1s chirp
  results.innerText = `Peak freq (mode): ${pitchTrack.mode}Hz\nMedian pitch: ${median_freq}Hz\nDelay: ${delay}ms`;

  auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
  console.log(pitchTrack);
};

runButton.addEventListener('click', runLatencyTest);

runSimButton.addEventListener('click', simulateLatencyTest);
