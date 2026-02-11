import { initJsPsych } from 'jspsych';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import audioButtonResponse from '@jspsych/plugin-audio-button-response';
import callFunction from '@jspsych/plugin-call-function';
import 'jspsych/css/jspsych.css';
import audioAudioResponse from './audio-audio-response';
import { AuditoryToolbox } from 'wbat';

const jsPsych = initJsPsych({
  on_finish: () => {
    jsPsych.data.displayData('json');
  },
});

const auditory = new AuditoryToolbox(jsPsych.pluginAPI.audioContext());

const trial = {
  type: htmlButtonResponse,
  choices: ['continue'],
  stimulus: 'Hello!',
};

const mic_permission_trial = {
  type: callFunction,
  async: true,
  async func(done: () => void) {
    await auditory.prepareMicStream();
    done();
  },
};

const tone_trial = {
  type: audioButtonResponse,
  stimulus: '../sounds/a4.wav',
  choices: ['Low', 'High'],
  prompt: '<p>Is the pitch high or low?</p>',
};

const latency_trial1 = {
  type: audioAudioResponse,
  stimulus: '../sounds/chirp4.wav',
  duration: 1.5,
  save_endpoint: '/save/loopback',
  auditory,
};

const latency_trial2 = {
  type: audioAudioResponse,
  stimulus: '../sounds/chirp8.wav',
  delay: 0.5,
  save_endpoint: '/save/loopback',
  auditory,
};

const latency_trial3 = {
  type: audioAudioResponse,
  stimulus: '../sounds/chirp16.wav',
  save_endpoint: '/save/loopback',
};

const runExperiment = async () => {
  try {
    await Promise.all([
      auditory.prepareAudioBuffer('../sounds/chirp4.wav'),
      auditory.prepareAudioBuffer('../sounds/chirp8.wav'),
      auditory.prepareAudioBuffer('../sounds/chirp16.wav'),
    ]);
  } catch (error) {
    console.warn('Stimulus preload failed:', error);
  }

  jsPsych.run([
    trial,
    mic_permission_trial,
    tone_trial,
    latency_trial1,
    latency_trial2,
    latency_trial3,
  ]);
};

void runExperiment();
