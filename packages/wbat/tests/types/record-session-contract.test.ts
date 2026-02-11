import { AuditoryToolbox } from '../../src/index';
import type { AudioData } from '../../src/core/audio-data';

const fakeContext = { sampleRate: 48000 } as AudioContext;
const auditory = new AuditoryToolbox(fakeContext);

async function checkRecordControllerContract() {
  const session = await auditory.record(0, 1);

  const id: string = session.id;
  const startTime: number = session.startTime;
  const endTime: number = session.endTime;
  session.stopAt(1.5);
  session.stopNow();
  const audioData: AudioData = await session.result;

  return { id, startTime, endTime, audioData };
}

void checkRecordControllerContract();
