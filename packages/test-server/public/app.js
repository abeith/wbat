import { AudioData, AuditoryToolbox } from '/auditoryToolbox/index.js';

const auditory = new AuditoryToolbox();
const testContainer = document.getElementById('test-container');
const runButton = document.getElementById('run');
const runSimButton = document.getElementById('run-sim');
const results = document.getElementById('results');
const canvas = document.getElementById('spectrogramCanvas');
const params = new URLSearchParams(window.location.search);
const splitView = params.get('plot') === 'channels';
const plotHost = document.createElement('div');

if (canvas instanceof HTMLCanvasElement) {
  canvas.insertAdjacentElement('afterend', plotHost);
  if (splitView) {
    canvas.remove();
  }
} else {
  results.insertAdjacentElement('afterend', plotHost);
}

const getCanvas = (id, label) => {
  let plot = document.getElementById(id);
  if (plot instanceof HTMLCanvasElement) {
    return plot;
  }

  const container = document.createElement('div');
  const heading = document.createElement('p');
  heading.innerText = label;
  plot = document.createElement('canvas');
  plot.id = id;
  container.appendChild(heading);
  container.appendChild(plot);
  plotHost.appendChild(container);
  return plot;
};

const splitLoopbackChannels = async (audioData) => {
  if (audioData.channels.length < 2) {
    throw new Error('Expected loopback data with 2 channels.');
  }

  const stimCanvas = getCanvas('spectrogramCanvasStim', 'Stimulus channel');
  const micCanvas = getCanvas('spectrogramCanvasMic', 'Microphone channel');
  const stimData = new AudioData([audioData.channels[0]], audioData.fs);
  const micData = new AudioData([audioData.channels[1]], audioData.fs);

  auditory.plotSpectrogram({
    canvas: stimCanvas,
    width: 800,
    height: 250,
    audioData: stimData,
  });
  auditory.plotSpectrogram({
    canvas: micCanvas,
    width: 800,
    height: 250,
    audioData: micData,
  });
};

const simulateLatencyTest = async () => {
  const sweep = params.get('sweep') || 4;
  const delay = params.get('delay') || 100;
  const source = `../sounds/chirp${sweep}_delay${delay}.wav`;
  const pitchTrack = await auditory.fmcw(
    source,
  );
  const detectedDelay = pitchTrack.mode / sweep;
  window.unitTestValue = pitchTrack.mode;
  results.innerText = `Delay: ${delay} ms\nDetected delay: ${detectedDelay} ms`;

  if (splitView) {
    const fileBuffer = await auditory.prepareAudioBuffer(source);
    const channels = [];
    for (let c = 0; c < fileBuffer.numberOfChannels; c++) {
      const channel = new Float32Array(fileBuffer.length);
      fileBuffer.copyFromChannel(channel, c);
      channels.push(channel);
    }

    if (channels.length >= 2) {
      await splitLoopbackChannels(
        new AudioData(channels, fileBuffer.sampleRate),
      );
    } else {
      results.innerText += '\nSplit view unavailable: file has one channel only.';
      const fallbackCanvas = getCanvas('spectrogramCanvasFallback', 'Spectrogram');
      auditory.plotSpectrogram(pitchTrack, fallbackCanvas, 800, 400);
    }
  } else {
    auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
  }
};

const runLatencyTest = async () => {
  let pitchTrack = await auditory.latencyTest('../sounds/chirp4.wav');
  const median_freq = Math.round(pitchTrack.median * 100) / 100; //
  const chirp_sweep = 4e3;
  const delay = Math.round((100 * 1000 * pitchTrack.mode) / chirp_sweep) / 100;
  results.innerText =
    `Peak freq (mode): ${pitchTrack.mode}Hz\n` +
    `Median pitch: ${median_freq}Hz\n` +
    `Delay: ${delay}ms`;
  if (splitView) {
    const fallbackCanvas = getCanvas('spectrogramCanvasFallback', 'Spectrogram');
    const sourceBuffer = await auditory.prepareAudioBuffer('../sounds/chirp4.wav');
    const channel = new Float32Array(sourceBuffer.length);
    sourceBuffer.copyFromChannel(channel, 0);
    auditory.plotSpectrogram({
      canvas: fallbackCanvas,
      width: 800,
      height: 400,
      audioData: new AudioData([channel], sourceBuffer.sampleRate),
      overlays: [{ f: pitchTrack.f, t: pitchTrack.t, color: 'red' }],
    });
  } else {
    auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
  }
  console.log(pitchTrack);
};

const runLatencyTest2 = async () => {
  const audioData = await auditory.virtualLoopback('../sounds/chirp4.wav', {
    delay: 0.5,
    duration: 1,
  });
  const id = auditory.generateUniqueId();

  auditory.saveLoopback(audioData, {
    id: id,
    signal: 'chirp4',
    userAgent: navigator.userAgent,
  });

  let pitchTrack = await auditory.fmcw(audioData);
  const median_freq = Math.round(pitchTrack.median * 100) / 100; //
  const chirp_sweep = 4e3;
  const delay = Math.round((100 * 1000 * pitchTrack.mode) / chirp_sweep) / 100;
  results.innerText =
    `Peak freq (mode): ${pitchTrack.mode}Hz\n` +
    `Median pitch: ${median_freq}Hz\n` +
    `Delay: ${delay}ms`;

  if (splitView) {
    await splitLoopbackChannels(audioData);
  } else {
    auditory.plotSpectrogram(pitchTrack, canvas, 800, 400);
  }
};

runButton.addEventListener('click', runLatencyTest2);

runSimButton.addEventListener('click', simulateLatencyTest);
