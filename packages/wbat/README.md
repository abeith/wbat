# wbat

Tools for accurately timed auditory data collection in a browser.

## Install

```sh
npm install wbat
```

## Testing

For test strategy and coverage boundaries see `TESTING.md`. For unit-test folder conventions see `tests/unit/README.md`.

## AudioWorklet setup (important)

WBAT loads the recorder worklet via:

```js
new URL('./worklets/recorder-worklet.js', import.meta.url);
```

When you build or install `wbat`, the worklet file lives at `dist/worklets/recorder-worklet.js`. You must serve that file at the URL resolved by the line above. In this repo’s test server, the worklet is exposed at /worklets/recorder-worklet.js` and the main bundle is served separately:

```js
app.use(
  '/worklets/recorder-worklet.js',
  express.static(
    path.join(
      __dirname,
      'node_modules/@wbat/recorder-worklet/dist/recorder-worklet.js',
    ),
  ),
);
app.use(
  '/auditoryToolbox',
  express.static(path.join(__dirname, 'node_modules/wbat/dist')),
);
```

If you serve `wbat/dist` directly, ensure the `worklets/` folder stays adjacent to the module file. If you are hosting static files (no Node/Express), copy `dist/` into your web root and keep the `worklets/` folder next to `index.js`. The worklet path is currently fixed relative to the module URL, so the simplest setup is to serve `index.js` and `worklets/recorder-worklet.js` from the same directory. If you need a different layout (e.g., `/js/worklets`), that would require a small API change to parameterize the worklet path.

## Basic recording example

```js
import { AuditoryToolbox } from 'wbat';

const auditory = new AuditoryToolbox();
const recordButton = document.querySelector('#record');

recordButton.addEventListener('click', async () => {
  const durationSeconds = 2;
  const id = await auditory.record(0, durationSeconds);

  // The WAV blob is available after recording stops.
  setTimeout(() => auditory.downloadBlob(id), (durationSeconds + 0.2) * 1000);
});
```

If you are not using a bundler, replace the bare import with a path to the built module you are serving (for example, if `dist/` is exposed at `/auditoryToolbox/`):

```js
import { AuditoryToolbox } from '/auditoryToolbox/index.js';
```

## Virtual loopback example

Virtual loopback records the stimulus and microphone response in the same AudioContext, storing them as stereo channels. This can be used to align response timing to stimulus features, recover the exact audio that was played, or analyze timing when the stimulus file and AudioContext settings don’t match (similar in spirit to physical loopback recordings in lab studies).

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
```

Timing options are required; provide `startTime` or `delay`, and `endTime` or `duration`.

## Experimental helpers

The following helpers are experimental and may change: `playChirp`, `playSine`, `createSineBuffer`, `getTimestamp`, `getLag`, `convertTime`, `checkTimestampRatio`, and `setStartTime`.

## Manual test matrix

These methods depend on browser permissions or user gestures and should be validated manually when changed.

| Method | Flags | Manual check |
| --- | --- | --- |
| `requestMicrophoneAccess` | `@requiresMicrophone`, `@requiresUserGesture` | Mic prompt appears and stream is accessible. |
| `prepareMicStream` | `@requiresMicrophone`, `@requiresUserGesture` | Mic stream is live and reused across calls. |
| `record` | `@requiresMicrophone`, `@requiresUserGesture` | Records expected duration; file saves correctly. |
| `virtualLoopback` | `@requiresMicrophone`, `@requiresUserGesture` | Stim + mic channels align with expected timing. |
| `play` | `@requiresUserGesture` | Audio output starts on schedule. |
| `playChirp` / `playSine` | `@requiresUserGesture` | Audio output starts and stops cleanly. |
