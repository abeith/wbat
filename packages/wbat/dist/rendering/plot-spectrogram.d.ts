import type { PitchTrackObject, SpectrogramData, SpectrogramPlotConfig } from '../types';
export declare const plotSpectrogram: ({ canvas, width, height, spectrogram, overlays, }: SpectrogramPlotConfig & {
    spectrogram: SpectrogramData;
}) => void;
export declare const plotPitchTrackValidation: (pitchTrackData: PitchTrackObject, canvas: HTMLCanvasElement, width: number, height: number, fs: number) => void;
//# sourceMappingURL=plot-spectrogram.d.ts.map