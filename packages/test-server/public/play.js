import { AudioData, AuditoryToolbox } from '/auditoryToolbox/index.js';

const auditory = new AuditoryToolbox();
const playFileButton = document.getElementById('play-file');
const playAudioDataButton = document.getElementById('play-audio-data');
const results = document.getElementById('results');

let audioData = null;

playAudioDataButton.style.display = 'none';

const loadAudioDataFromFile = async (source) => {
  const buffer = await auditory.prepareAudioBuffer(source);
  const channel = new Float32Array(buffer.length);
  buffer.copyFromChannel(channel, 0);
  return new AudioData([channel], buffer.sampleRate);
};

const playFile = async () => {
  const source = './sounds/a4.wav';
  try {
    await auditory.play(source);
    const buffer = await auditory.prepareAudioBuffer(source);
    audioData = await loadAudioDataFromFile(source);
    playAudioDataButton.style.display = 'inline-block';
    window.playbackReady = true;
    if (results) {
      results.innerText = `Loaded ${source} (${buffer.duration.toFixed(3)}s)`;
    }
  } catch (error) {
    if (results) {
      results.innerText = `Playback failed: ${error instanceof Error ? error.message : error}`;
    }
  }
};

const playAudioData = async () => {
  if (!audioData) {
    if (results) {
      results.innerText = 'AudioData not loaded yet.';
    }
    return;
  }
  await auditory.play(audioData);
  window.playbackPlayed = true;
  if (results) {
    results.innerText = 'Played AudioData.';
  }
};

playFileButton.addEventListener('click', playFile);
playAudioDataButton.addEventListener('click', playAudioData);
