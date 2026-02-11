import { AuditoryToolbox } from '/auditoryToolbox/index.js';

const logOutput = document.getElementById('log');
const basicRecordButton = document.getElementById('basic-record');
const stopNowButton = document.getElementById('stop-now');
const stopAtButton = document.getElementById('stop-at');
const customWorkletButton = document.getElementById('custom-worklet');
const manualStopButton = document.getElementById('manual-stop');

const auditory = new AuditoryToolbox();
let activeSession = null;

window.activeSession = null;
window.lastSession = null;
window.lastRecordData = null;

const appendLog = (message) => {
  if (!(logOutput instanceof HTMLElement)) {
    console.log(message);
    return;
  }
  logOutput.textContent += `${message}\n`;
};

const ensureMicAccess = async (toolbox) => {
  await toolbox.requestMicrophoneAccess();
};

const runSession = async (label, startFn) => {
  try {
    appendLog(`[${label}] requesting microphone access...`);
    await ensureMicAccess(auditory);
    appendLog(`[${label}] recorder worklet URL: ${auditory.getRecorderWorkletUrl()}`);
    activeSession = await startFn();
    window.activeSession = activeSession;
    window.lastSession = activeSession;
    appendLog(
      `[${label}] session id: ${activeSession.id} | start: ${activeSession.startTime} | end: ${activeSession.endTime}`,
    );
    const audioData = await activeSession.result;
    appendLog(
      `[${label}] complete (${audioData.channels[0].length} frames at ${audioData.fs} Hz).`,
    );
    window.lastSession = activeSession;
    window.lastRecordData = audioData;
  } catch (error) {
    appendLog(`[${label}] error: ${error}`);
  } finally {
    activeSession = null;
    window.activeSession = null;
  }
};

if (basicRecordButton instanceof HTMLElement) {
  basicRecordButton.addEventListener('click', async () => {
    await runSession('basic', async () => auditory.record(0.1, 1.0));
  });
}

if (stopNowButton instanceof HTMLElement) {
  stopNowButton.addEventListener('click', async () => {
    await runSession('stopNow', async () => {
      const session = await auditory.record(0.0, 10.0);
      window.setTimeout(() => {
        appendLog('[stopNow] calling session.stopNow()');
        session.stopNow();
        appendLog(`[stopNow] updated end time: ${session.endTime}`);
      }, 1500);
      return session;
    });
  });
}

if (stopAtButton instanceof HTMLElement) {
  stopAtButton.addEventListener('click', async () => {
    await runSession('stopAt', async () => {
      const session = await auditory.record(0.0, 10.0);
      const ts = auditory.getTimestamp();
      if (typeof ts.contextTime === 'undefined') {
        throw new Error('Audio context timestamp missing contextTime.');
      }
      const stopTime = ts.contextTime + 2.0;
      appendLog(`[stopAt] calling session.stopAt(${stopTime})`);
      session.stopAt(stopTime);
      appendLog(`[stopAt] updated end time: ${session.endTime}`);
      return session;
    });
  });
}

if (customWorkletButton instanceof HTMLElement) {
  customWorkletButton.addEventListener('click', async () => {
    try {
      const customAuditory = new AuditoryToolbox(undefined, {
        recorderWorkletUrl: '/worklets/recorder-worklet.js',
      });
      appendLog('[customWorklet] requesting microphone access...');
      await ensureMicAccess(customAuditory);
      const session = await customAuditory.record(0.0, 1.0);
      appendLog(
        `[customWorklet] session id: ${session.id} | start: ${session.startTime} | end: ${session.endTime}`,
      );
      const audioData = await session.result;
      appendLog(
        `[customWorklet] complete (${audioData.channels[0].length} frames at ${audioData.fs} Hz).`,
      );
      window.lastSession = session;
      window.lastRecordData = audioData;
    } catch (error) {
      appendLog(`[customWorklet] error: ${error}`);
    }
  });
}

if (manualStopButton instanceof HTMLElement) {
  manualStopButton.addEventListener('click', () => {
    if (!activeSession) {
      appendLog('[manualStop] no active session.');
      return;
    }
    appendLog('[manualStop] calling activeSession.stopNow()');
    activeSession.stopNow();
    appendLog(`[manualStop] updated end time: ${activeSession.endTime}`);
  });
}

appendLog('Ready. Click an example button to start.');
appendLog('Tip: inspect window.activeSession, window.lastSession, window.lastRecordData.');
