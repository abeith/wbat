# WBAT testing strategy

## Why this exists

WBAT mixes pure DSP/data logic with browser APIs (`AudioContext`, `AudioWorklet`, `navigator.mediaDevices`) that depend on permissions, device hardware, browser timing behavior, and user interaction. Unit tests are best for deterministic logic; browser-runtime/manual tests are still required for client/device behavior.

## Test layers

- Unit tests (`packages/wbat/tests/unit`): fast, deterministic, no microphone access, no user gesture, no real audio device.
- Browser-runtime tests (repo `tests/` + `packages/test-server/public`): exercise real client-side wiring and UI flows in Puppeteer against the local test server.
- Manual smoke tests: confirm microphone permissions, WebAudio timing, and browser-specific behavior.

Note: browser-runtime tests are likely to move under `packages/wbat/tests/` over time so package-level tests live together.

## Current unit coverage

| Area                                                                 | Covered in unit tests | Notes                              |
| -------------------------------------------------------------------- | --------------------- | ---------------------------------- |
| `AudioData` validation and multiply                                  | Yes                   | `audio-data.test.ts`               |
| Utility helpers (`mergeChunks`, `calculateBinOffset`, ID generation) | Yes                   | `auditory-toolbox-utils.test.ts`   |
| Input validation for `saveLoopback` metadata                         | Yes                   | `save-loopback-validation.test.ts` |
| Spectral behavior (`fmcw` edge-bin and mid-band interpolation)       | Yes                   | `fmcw-spectral.test.ts`            |

## Not covered by unit tests (by design)

- Real `AudioWorklet` loading and worklet URL resolution in a browser runtime.
- `getUserMedia`/microphone permission flow and real recording behavior.
- Audio device latency/timing behavior (`currentTime`, output timestamp quirks, cross-browser differences).
- End-to-end loopback behavior with actual playback and capture.

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

## Folder layout and intent

- `packages/wbat/tests/unit`: pure/unit tests with lightweight mocks where needed.
- `tests` (repo root): browser-runtime (client-side) tests using Puppeteer against pages served by `packages/test-server/public`; may migrate into `packages/wbat/tests/runtime`.

## Running tests

- WBAT unit tests: `npm run test:unit -w packages/wbat`
- WBAT type contract tests: `npm run test:types -w packages/wbat`
- Existing browser tests: start the test server (`npm run start -w packages/test-server`) and, in another terminal, run `npm run tests:headed` from the repo root (the tests expect `http://localhost:3000`).

Type contract tests are compile-time checks for API shape (for example accepted argument types and expected return fields). They catch breaking type/interface changes but do not replace runtime behavior tests.

## Guidance for adding more ambitious unit tests

- Prefer extracting logic into pure functions/classes and test those directly.
- Mock only API boundaries (for example `fetch`, `WaveFile`, and thin audio wrappers), not internal logic.
- Use tolerance-based assertions for float math (`toBeCloseTo`) rather than exact equality.
- Keep unit tests independent of the file server and browser UI pages.

## Suggested next unit-test targets

- [ ] Browser/runtime test for worklet URL resolution + `recorderWorkletUrl` override.
- [ ] FMCW input-shape validation (mono vs stereo contract).
