# test-server public assets

This directory is served statically by `packages/test-server` and contains the manual browser pages used to exercise wbat behaviours that cannot be validated in Node alone. It is deliberately lightweight and kept alongside the server so it can access local endpoints.

- `index.html` and `app.js` are the quick manual demo for basic playback/recording behaviour.
- `jspsych.html` and `jspsych.js` are the jsPsych demo client; `jspsych.js` is generated from `packages/test-server/src/expt.ts`.
- `loopback-scheduling.html` and `loopback-scheduling.js` are manual scheduling diagnostics and are also driven by `tests/loopbackScheduling.test.ts`.
- `latency.html` and `latency.js` are the latency unit-test pages used by `tests/latencyTest.test.ts`.
- `pitch-detect.html` and `pitch-detect.js` are the pitch detection unit-test pages used by `tests/detectPitch.test.ts`.
- `play.html` and `play.js` are the minimal playback demo pages used by `tests/playback.test.ts`.
- `record-session.html` and `record-session-examples.js` are the record session exploration pages.

If you change public assets or add new test pages, consider updating the scheduling tests and keep this list current.
