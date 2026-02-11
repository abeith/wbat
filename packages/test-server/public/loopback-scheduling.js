import { AuditoryToolbox } from '/auditoryToolbox/index.js';

const auditory = new AuditoryToolbox();
const logOutput = document.getElementById('log');
const resultsOutput = document.getElementById('results');
const absoluteTightButton = document.getElementById('test-absolute-tight');
const absolutePreparedButton = document.getElementById('test-absolute-prepared');
const relativeButton = document.getElementById('test-relative');
const relativeLongButton = document.getElementById('test-relative-long');
const quantizedButton = document.getElementById('test-quantized');
const halfSampleButton = document.getElementById('test-half-sample');
const pastDurationButton = document.getElementById('test-past-duration');
const pastEndButton = document.getElementById('test-past-end');

const DEFAULT_DELAY = 0.1;
const DEFAULT_DURATION = 1;
const TEST_TIMEOUT_MS = 15000;
const BARKER_13 = [1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1];
const PATTERN_SCALE = 0.8;
const PATTERN = new Float32Array(BARKER_13.map((value) => value * PATTERN_SCALE));
const PATTERN_ENERGY = PATTERN.reduce(
  (sum, value) => sum + value * value,
  0,
);
const PATTERN_MATCH_THRESHOLD = PATTERN_ENERGY * 0.5;

const logLine = (message) => {
  if (logOutput instanceof HTMLElement) {
    logOutput.textContent += `${message}\n`;
  }
  console.log(message);
};

const ensureMicAccess = async () => {
  await auditory.prepareMicStream();
};

const getOutputTimestamp = () => {
  const ts = auditory.getTimestamp();
  if (typeof ts.contextTime !== 'number') {
    throw new Error('contextTime is undefined.');
  }
  return ts;
};

const getContextTime = () => getOutputTimestamp().contextTime;

const buildTestSignal = (length) => {
  const signal = new Float32Array(length);
  signal.set(PATTERN, 0);
  if (length > PATTERN.length * 2) {
    signal.set(PATTERN, length - PATTERN.length);
  }
  return signal;
};

const buildTestBuffer = (duration = DEFAULT_DURATION) => {
  const probe = auditory.createBufferFromPCM(new Float32Array(1));
  const length = Math.max(4096, Math.round(probe.sampleRate * duration));
  const signal = buildTestSignal(length);
  const buffer = auditory.createBufferFromPCM(signal);
  return { signal, buffer, fs: buffer.sampleRate };
};

const quantizeTime = (time, fs) => Math.ceil(time * fs) / fs;

const formatSlice = (data, count = 12) =>
  Array.from(data.slice(0, count)).map((value) => value.toFixed(3));

const findFirstAbove = (data, threshold = 1e-3) => {
  for (let i = 0; i < data.length; i += 1) {
    if (Math.abs(data[i]) > threshold) {
      return i;
    }
  }
  return -1;
};

const findPatternOffset = (data, pattern, maxLag = 2048) => {
  let bestOffset = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  const limit = Math.min(maxLag, data.length - pattern.length);

  for (let lag = 0; lag <= limit; lag += 1) {
    let score = 0;
    for (let i = 0; i < pattern.length; i += 1) {
      score += pattern[i] * data[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestOffset = lag;
    }
  }

  return { offset: bestOffset, score: bestScore };
};

const estimateFractionalOffset = (data, pattern, maxLag = 2048) => {
  const limit = Math.min(maxLag, data.length - pattern.length);
  if (limit < 1) {
    return { offset: -1, score: Number.NEGATIVE_INFINITY };
  }

  const scores = new Float32Array(limit + 1);
  let bestOffset = -1;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let lag = 0; lag <= limit; lag += 1) {
    let score = 0;
    for (let i = 0; i < pattern.length; i += 1) {
      score += pattern[i] * data[i + lag];
    }
    scores[lag] = score;
    if (score > bestScore) {
      bestScore = score;
      bestOffset = lag;
    }
  }

  if (bestOffset <= 0 || bestOffset >= limit) {
    return { offset: bestOffset, score: bestScore };
  }

  const a = scores[bestOffset - 1];
  const b = scores[bestOffset];
  const c = scores[bestOffset + 1];
  const denominator = 2 * (a - 2 * b + c);
  const p = denominator !== 0 ? (a - c) / denominator : 0;
  return { offset: bestOffset + p, score: bestScore };
};

const estimateFractionalDelayLinear = (data, pattern, offset = 0) => {
  if (offset < 0 || offset + pattern.length >= data.length) {
    return null;
  }

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < pattern.length - 1; i += 1) {
    const x0 = pattern[i];
    const x1 = pattern[i + 1];
    const y = data[offset + i];
    const dx = x1 - x0;
    numerator += (y - x0) * dx;
    denominator += dx * dx;
  }

  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
};
const findPatternOffsetFromEnd = (data, pattern, maxLag = 4096) => {
  const start = Math.max(0, data.length - pattern.length - maxLag);
  const segment = data.slice(start);
  const result = findPatternOffset(segment, pattern, maxLag);
  if (result.offset < 0) {
    return { offset: -1, score: result.score };
  }
  return { offset: start + result.offset, score: result.score };
};

const computeSchedule = (options, now) => {
  const scheduledStart =
    typeof options.startTime === 'number'
      ? options.startTime
      : now + (options.delay ?? DEFAULT_DELAY);
  const scheduledEnd =
    typeof options.endTime === 'number'
      ? options.endTime
      : scheduledStart + (options.duration ?? DEFAULT_DURATION);

  return { scheduledStart, scheduledEnd };
};

const prepareLoopbackTest = async (duration = DEFAULT_DURATION) => {
  await ensureMicAccess();
  return buildTestBuffer(duration);
};

const withTimeout = async (promise, timeoutMs) => {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
};

const runLoopbackTest = async (
  label,
  options,
  prepared,
  scheduledAt,
  expectedFailure = false,
) => {
  logLine(`\n--- ${label} ---`);
  logLine(`options: ${JSON.stringify(options)}`);

  const { signal, buffer, fs } = prepared;
  const nowTs = getOutputTimestamp();
  const { scheduledStart, scheduledEnd } = computeSchedule(options, scheduledAt);
  logLine(`contextTime at schedule: ${scheduledAt.toFixed(4)}`);
  logLine(`contextTime at call: ${nowTs.contextTime.toFixed(4)}`);
  if (typeof nowTs.performanceTime === 'number') {
    logLine(`performanceTime at call: ${nowTs.performanceTime.toFixed(2)}`);
  }
  logLine(`scheduled startTime: ${scheduledStart.toFixed(4)}`);
  logLine(`scheduled endTime: ${scheduledEnd.toFixed(4)}`);
  if (typeof options.startTime === 'number') {
    logLine(`startTime option: ${options.startTime.toFixed(4)}`);
    logLine(
      `startTime delta (scheduled - option): ${(scheduledStart - options.startTime).toFixed(4)}s`,
    );
  }

  const intendedDuration = scheduledEnd - scheduledStart;
  let result = {
    label,
    options,
    fs,
    inputLength: signal.length,
    stimLength: null,
    inputHead: Array.from(signal.slice(0, 8)),
    stimHead: null,
    recordedDuration: null,
    intendedDuration,
    trailingFrames: null,
    status: 'FAIL',
    error: null,
  };

  if (expectedFailure && scheduledEnd <= scheduledStart) {
    result = {
      ...result,
      status: 'EXPECTED_FAIL',
      error: 'Invalid window: endTime must be greater than startTime.',
    };
    logLine(`result status: ${result.status}`);
    logLine(`error: ${result.error}`);
    if (resultsOutput instanceof HTMLElement) {
      resultsOutput.textContent = JSON.stringify(result, null, 2);
    }
    return;
  }

  try {
    const audioData = await withTimeout(
      auditory.virtualLoopback(buffer, options),
      TEST_TIMEOUT_MS,
    );
    const stim = audioData.channels[0];
    const recordedDuration = stim.length / fs;
    const durationPass = recordedDuration >= intendedDuration;
    const endTs = getOutputTimestamp();
    const approxStartTime = endTs.contextTime - recordedDuration;

    const inputStartIndex = findFirstAbove(signal);
    const stimStartIndex = findFirstAbove(stim);
    const inputOffset = findPatternOffset(signal, PATTERN);
    const stimOffset = findPatternOffset(stim, PATTERN);
    const inputFracOffset = estimateFractionalOffset(signal, PATTERN);
    const stimFracOffset = estimateFractionalOffset(stim, PATTERN);
    const hasFullStim = stim.length >= signal.length;
    const stimTailOffset = hasFullStim
      ? findPatternOffsetFromEnd(stim, PATTERN)
      : { offset: -1, score: 0 };
    const hasTailMatch =
      stimTailOffset.offset >= 0 &&
      stimTailOffset.score >= PATTERN_MATCH_THRESHOLD;

    const stimInputDelta =
      stimOffset.offset >= 0 && inputOffset.offset >= 0
        ? stimOffset.offset - inputOffset.offset
        : null;
    const stimFracDelay =
      stimOffset.offset >= 0
        ? estimateFractionalDelayLinear(stim, PATTERN, stimOffset.offset)
        : null;
    const stimInputFracDelta =
      stimFracOffset.offset >= 0 && inputFracOffset.offset >= 0
        ? stimFracOffset.offset - inputFracOffset.offset
        : null;
    const stimInputDeltaMs =
      typeof stimInputDelta === 'number'
        ? (stimInputDelta / fs) * 1000
        : null;
    const stimAligned = stimInputDelta === 0;
    const trailingFrames = hasTailMatch
      ? stim.length - (stimTailOffset.offset + PATTERN.length)
      : null;
    const trailingMs =
      typeof trailingFrames === 'number' ? (trailingFrames / fs) * 1000 : null;

    logLine(`fs (context): ${fs} Hz`);
    logLine(
      `recorded duration: ${recordedDuration.toFixed(4)}s ` +
        '(rounded to the recorder worklet chunk size, 2048 frames)',
    );
    logLine(
      `duration check: ${durationPass ? 'PASS' : 'FAIL'} ` +
        `(recorded ${recordedDuration.toFixed(4)}s vs intended ${intendedDuration.toFixed(4)}s)`,
    );
    logLine(`approx endTime (context): ${endTs.contextTime.toFixed(4)}`);
    logLine(`approx startTime (derived): ${approxStartTime.toFixed(4)}`);
    if (typeof endTs.performanceTime === 'number') {
      logLine(`performanceTime at end: ${endTs.performanceTime.toFixed(2)}`);
    }
    logLine(`input first values: ${formatSlice(signal).join(', ')}`);
    logLine(`stim first values: ${formatSlice(stim).join(', ')}`);
    logLine(`input first-above threshold index: ${inputStartIndex}`);
    logLine(`stim first-above threshold index: ${stimStartIndex}`);
    logLine(
      `pattern offset input: ${inputOffset.offset} ` +
        `(score ${inputOffset.score.toFixed(3)}) ` +
        `${inputOffset.offset === 0 ? 'PASS' : 'FAIL'}`,
    );
    logLine(
      `pattern offset stim: ${stimOffset.offset} ` +
        `(score ${stimOffset.score.toFixed(3)}) ` +
        `${stimOffset.offset === 0 ? 'PASS' : 'FAIL'}`,
    );
    logLine(
      stimInputFracDelta === null
        ? 'stim-input delta (fractional): n/a'
        : `stim-input delta (fractional): ${stimInputFracDelta.toFixed(3)} samples`,
    );
    logLine(
      stimFracDelay === null
        ? 'stim fractional delay (linear): n/a'
        : `stim fractional delay (linear): ${stimFracDelay.toFixed(3)} samples`,
    );
    if (!hasFullStim) {
      logLine(
        'stim trailing frames: n/a (recording shorter than input signal)',
      );
    } else {
      logLine(
        `pattern offset stim tail: ${stimTailOffset.offset} ` +
          `(score ${stimTailOffset.score.toFixed(3)})`,
      );
      logLine(
        trailingFrames === null
          ? 'stim trailing frames: n/a (tail pattern not found)'
          : `stim trailing frames: ${trailingFrames} (${trailingMs.toFixed(2)} ms)`,
      );
    }
    logLine(
      stimInputDelta === null
        ? 'stim-input delta: n/a (pattern not found)'
        : `stim-input delta: ${stimInputDelta} (${stimInputDeltaMs.toFixed(2)} ms)`,
    );

    result = {
      ...result,
      stimLength: stim.length,
      stimHead: Array.from(stim.slice(0, 8)),
      recordedDuration,
      trailingFrames,
      inputOffset: inputOffset.offset,
      stimOffset: stimOffset.offset,
      stimInputDelta,
      stimInputFracDelta,
      stimFracDelay,
      stimAligned,
      status: expectedFailure ? 'UNEXPECTED_PASS' : 'PASS',
    };
  } catch (error) {
    result = {
      ...result,
      status: expectedFailure ? 'EXPECTED_FAIL' : 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    };
    logLine(`result status: ${result.status}`);
    if (result.error) {
      logLine(`error: ${result.error}`);
    }
  }

  if (resultsOutput instanceof HTMLElement) {
    resultsOutput.textContent = JSON.stringify(result, null, 2);
  }
};

const runAbsoluteTightTest = async () => {
  const scheduledAt = getContextTime();
  const startTime = scheduledAt + 0.1;
  const endTime = startTime + 1.0;
  const prepared = await prepareLoopbackTest();
  await runLoopbackTest(
    'Absolute start/end (tight, expect clamp)',
    { startTime, endTime },
    prepared,
    scheduledAt,
  );
};

const runAbsolutePreparedTest = async () => {
  const prepared = await prepareLoopbackTest();
  const scheduledAt = getContextTime();
  const startTime = scheduledAt + 0.8;
  const endTime = startTime + 1.0;
  await runLoopbackTest(
    'Absolute start/end (prepared, expect pass)',
    { startTime, endTime },
    prepared,
    scheduledAt,
  );
};

const runRelativeTest = async () => {
  const prepared = await prepareLoopbackTest();
  const scheduledAt = getContextTime();
  await runLoopbackTest(
    'Delay + duration',
    { delay: 0.2, duration: 1.0 },
    prepared,
    scheduledAt,
  );
};

const runRelativeLongTest = async () => {
  const prepared = await prepareLoopbackTest(2.0);
  const scheduledAt = getContextTime();
  await runLoopbackTest(
    'Delay + duration (2s)',
    { delay: 0.2, duration: 2.0 },
    prepared,
    scheduledAt,
  );
};

const runQuantizedTest = async () => {
  const prepared = await prepareLoopbackTest();
  const scheduledAt = getContextTime();
  const startTime = quantizeTime(scheduledAt + 0.4, prepared.fs);
  const endTime = startTime + 1.0;
  await runLoopbackTest(
    'Quantised start/end',
    { startTime, endTime },
    prepared,
    scheduledAt,
  );
};

const runHalfSampleTest = async () => {
  const prepared = await prepareLoopbackTest();
  const scheduledAt = getContextTime();
  const startTime =
    quantizeTime(scheduledAt + 0.4, prepared.fs) + 0.5 / prepared.fs;
  const endTime = startTime + 1.0;
  await runLoopbackTest(
    'Quantised + 0.5/fs',
    { startTime, endTime },
    prepared,
    scheduledAt,
  );
};

const runTightDurationTest = async () => {
  const scheduledAt = getContextTime();
  const prepared = await prepareLoopbackTest();
  await runLoopbackTest(
    'Tight start, keep duration',
    {
      startTime: scheduledAt,
      duration: 1.0,
    },
    prepared,
    scheduledAt,
  );
};

const runTightEndTest = async () => {
  const scheduledAt = getContextTime();
  const prepared = await prepareLoopbackTest();

  await runLoopbackTest(
    'Tight start, keep endTime',
    {
      startTime: scheduledAt,
      endTime: scheduledAt,
    },
    prepared,
    scheduledAt,
    true,
  );
};

if (absoluteTightButton instanceof HTMLElement) {
  absoluteTightButton.addEventListener('click', runAbsoluteTightTest);
}

if (absolutePreparedButton instanceof HTMLElement) {
  absolutePreparedButton.addEventListener('click', runAbsolutePreparedTest);
}

if (relativeButton instanceof HTMLElement) {
  relativeButton.addEventListener('click', runRelativeTest);
}

if (relativeLongButton instanceof HTMLElement) {
  relativeLongButton.addEventListener('click', runRelativeLongTest);
}

if (quantizedButton instanceof HTMLElement) {
  quantizedButton.addEventListener('click', runQuantizedTest);
}

if (halfSampleButton instanceof HTMLElement) {
  halfSampleButton.addEventListener('click', runHalfSampleTest);
}

if (pastDurationButton instanceof HTMLElement) {
  pastDurationButton.addEventListener('click', runTightDurationTest);
}

if (pastEndButton instanceof HTMLElement) {
  pastEndButton.addEventListener('click', runTightEndTest);
}

logLine('Ready. Use the buttons to run manual scheduling tests.');
