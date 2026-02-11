import { AuditoryToolbox } from '../../src/index';

const fakeContext = { sampleRate: 48000 } as AudioContext;

const auditory = new AuditoryToolbox(fakeContext, {
  recorderWorkletUrl: '/worklets/recorder-worklet.js',
});

auditory.setRecorderWorkletUrl('/custom/worklets/recorder-worklet.js');
const workletUrl: string = auditory.getRecorderWorkletUrl();
void workletUrl;
