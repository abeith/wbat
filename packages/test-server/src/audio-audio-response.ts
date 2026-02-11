import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from 'jspsych';
import { AuditoryToolbox, AudioData } from 'wbat';

const info = <const>{
  name: 'audio-audio-response',
  version: '0.0.1',
  parameters: {
    stimulus: {
      type: ParameterType.AUDIO,
      default: undefined,
    },
    delay: {
      type: ParameterType.FLOAT,
      default: 0,
    },
    duration: {
      type: ParameterType.FLOAT,
      default: 1,
    },
    save_endpoint: {
      type: ParameterType.STRING,
      default: undefined,
    },
    auditory: {
      type: ParameterType.OBJECT,
      default: null,
    },
  },
  data: {
    response_id: {
      type: ParameterType.STRING,
    },
    stimulus: {
      type: ParameterType.STRING,
    },
    metadata: {
      type: ParameterType.OBJECT,
    },
  },
};

type Info = typeof info;

class AudioAudioResponsePlugin implements JsPsychPlugin<Info> {
  static info = info;
  private context: AudioContext;

  constructor(private jsPsych: JsPsych) {
    // Why is this not here in the audio-button-response plugin?
    this.context = this.jsPsych.pluginAPI.audioContext();
  }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    const stimulusElement = document.createElement('div');
    stimulusElement.id = 'jspsych-audio-audio-response-stimulus';
    stimulusElement.innerHTML = '<p>This is an audio-audio-response trial</p>';

    display_element.appendChild(stimulusElement);

    const auditory =
      trial.auditory instanceof AuditoryToolbox
        ? trial.auditory
        : new AuditoryToolbox(this.context);

    const saveWave = async (audio_data: AudioData, id: string) => {
      trial_data.metadata.fs = audio_data.fs;
      trial_data.metadata.baseLatency = this.context.baseLatency;
      trial_data.metadata.outputLatency = this.context.outputLatency;

      await auditory.saveLoopback(
        audio_data,
        {
          id: trial_data.response_id,
          signal: trial.stimulus,
          userAgent: trial_data.metadata.userAgent || navigator.userAgent,
        },
        trial.save_endpoint,
      );
      return id;
    };

    const playStim = async () => {
      const delay = typeof trial.delay === 'number' ? trial.delay : 0;
      const duration = typeof trial.duration === 'number' ? trial.duration : 1;
      const audio_data: AudioData = await auditory.virtualLoopback(
        trial.stimulus,
        {
          delay,
          duration,
        },
      );

      if (trial.save_endpoint) {
        // saveWave blocks even without await because WAV encoding runs on the main thread.
        await saveWave(audio_data, trial_data.response_id);
      }

      this.jsPsych.finishTrial(trial_data);
    };

    interface AudioMetadata {
      userAgent?: string;
      fs?: number;
      baseLatency?: number;
      outputLatency?: number;
    }

    const trial_data: {
      response_id: string;
      stimulus: string;
      metadata: AudioMetadata;
    } = {
      response_id: auditory.generateUniqueId(),
      stimulus: trial.stimulus,
      metadata: { userAgent: navigator.userAgent },
    };

    playStim();
  }
}

export default AudioAudioResponsePlugin;
