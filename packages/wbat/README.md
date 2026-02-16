# wbat

Tools for accurately timed auditory data collection in a browser.

## Testing

For test strategy, coverage boundaries, and the manual test matrix see `TESTING.md`. For unit-test folder conventions see `tests/unit/README.md`.

## AudioWorklet setup (important)

WBAT uses an [AudioWorklet](https://developer.mozilla.org/docs/Web/API/AudioWorklet) to record audio. Because the AudioWorklet runs in a separate thread, it must be served as a separate file. WBAT loads the recorder worklet from `./worklets/recorder-worklet.js`, resolved relative to the module URL. The recommended setup is to serve the `dist/` folder as-is and import `index.js` from that same directory.

If you are using Node/Express, serve the `dist/` folder and import it from that mount point (for example, `/js/wbat`):

```js
app.use('/js/wbat', express.static(path.join(__dirname, 'node_modules/wbat/dist')));
```

If you are serving static files (for example, Apache or nginx), copy the contents of `dist/` into your web root so `worklets/` sits next to `index.js`:

```text
public/
  js/
    wbat/
      index.js
      worklets/
        recorder-worklet.js
```

```js
import { AuditoryToolbox } from '/js/wbat/index.js';
const auditory = new AuditoryToolbox();
```

If you have bundled the worklet separately (for example, hosting it at `/js/recorder-worklet/index.js`), pass a custom URL when constructing the toolbox:

```js
const auditory = new AuditoryToolbox({
  recorderWorkletUrl: '/js/recorder-worklet/index.js',
});
```

## Virtual loopback example

Virtual loopback records the stimulus and microphone response in the same AudioContext, storing them as stereo channels. This can be used to align response timing to stimulus features, recover the exact audio that was played, or analyze timing when the stimulus file and AudioContext settings don’t match (similar in spirit to physical loopback recordings in lab studies).

Timing options are required; provide `startTime` or `delay`, and `endTime` or `duration`.

In this example, the provided _chirp_ signal with a 4 kHz sweep is captured along with the microphone signal. The delay between the stimulus being played and the microphone signal being received is the round-trip latency (RTL). You can estimate RTL for a chirp using the [Frequency-Modulated Continuous-Wave method](https://en.wikipedia.org/wiki/Continuous-wave_radar) (see `fmcw()` or `latencyTest()`). The returned `AudioData` stores the stimulus on channel 0 and the microphone signal on channel 1.

```js
import { AuditoryToolbox } from 'wbat';

const auditory = new AuditoryToolbox();

async function runTrial() {
  const sourceUrl = '/sounds/chirp4.wav';
  const audioData = await auditory.virtualLoopback(sourceUrl, {
    delay: 0.1,
    duration: 1,
  });

  // Optional: post to a server endpoint (see packages/test-server for a full example).
  await auditory.saveLoopback(audioData, {
    id: 'trial-001',
    userAgent: navigator.userAgent,
    signal: sourceUrl,
  });
}

runTrial();
```

## Basic recording example

For simple audio recording, the `record` method can be used. This method returns a _session controller_ that allows the preset duration to be overridden with `stopNow()` (or `stopAt()` if you have a context time). You should still provide a maximum duration even if you plan to stop early, so recordings are always bounded.

In this example, we can begin recording, stop recording, and save the resulting file with user interactions.

```js
import { AuditoryToolbox } from 'wbat';

const auditory = new AuditoryToolbox();
const recordButton = document.querySelector('#record');
const stopButton = document.querySelector('#stop');
const saveButton = document.querySelector('#save');
let activeSession = null;

const handleRecordClick = async () => {
  const delaySeconds = 0;
  const durationSeconds = 30; // Max duration in seconds.
  // Note that we are awaiting the session controller here and not the recording
  activeSession = await auditory.record(delaySeconds, durationSeconds);
};

const handleStopClick = () => {
  if (activeSession) {
    activeSession.stopNow();
  }
};

const handleSaveClick = async () => {
  if (!activeSession) {
    return;
  }

  // The WAV blob is available after recording stops.
  await activeSession.result;
  auditory.downloadBlob(activeSession.id);
  activeSession = null;
};

recordButton.addEventListener('click', handleRecordClick);
stopButton.addEventListener('click', handleStopClick);
saveButton.addEventListener('click', handleSaveClick);
```

Long durations are not recommended when using `wbat` as recordings are uncompressed and would lead to large file sizes.

## Experimental helpers

The following helpers are experimental and may change: `playChirp`, `playSine`, `createSineBuffer`, `getTimestamp`, `getLag`, `convertTime`, `checkTimestampRatio`, and `setStartTime`.
