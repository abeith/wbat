import type {
  PitchTrackObject,
  SpectrogramData,
  SpectrogramOverlay,
  SpectrogramPlotConfig,
} from '../types';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  overlay: SpectrogramOverlay,
  spectrogram: SpectrogramData,
  width: number,
  height: number,
): void => {
  const numFrames = spectrogram.specs.length;
  if (numFrames === 0 || overlay.f.length === 0) {
    return;
  }

  const maxFrequencyBin = spectrogram.fft_size / 2;
  const pixelsPerBin = Math.max(1, Math.floor(height / maxFrequencyBin));
  const totalDurationS =
    ((numFrames - 1) * spectrogram.hop_size) / spectrogram.fs;
  const overlayOffsetS = overlay.timeOffsetS ?? 0;

  ctx.strokeStyle = overlay.color ?? 'red';
  ctx.lineWidth = overlay.lineWidth ?? 2;
  ctx.beginPath();

  for (let i = 0; i < overlay.f.length; i++) {
    const frequency = overlay.f[i];
    if (!Number.isFinite(frequency)) {
      continue;
    }

    let x: number;
    if (overlay.t && overlay.t.length === overlay.f.length) {
      const normalisedT =
        totalDurationS > 0
          ? (overlay.t[i] + overlayOffsetS) / totalDurationS
          : 0;
      x = normalisedT * width;
    } else {
      x = (i / Math.max(overlay.f.length - 1, 1)) * width;
    }

    const peakBin = (frequency * spectrogram.fft_size) / spectrogram.fs;
    const y = height - peakBin * pixelsPerBin;
    const xClamped = clamp(x, 0, width);
    const yClamped = clamp(y, 0, height);

    if (i === 0) {
      ctx.moveTo(xClamped, yClamped);
    } else {
      ctx.lineTo(xClamped, yClamped);
    }
  }

  ctx.stroke();
};

export const plotSpectrogram = ({
  canvas,
  width,
  height,
  spectrogram,
  overlays = [],
}: SpectrogramPlotConfig & { spectrogram: SpectrogramData }): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Unable to get canvas context');
    return;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const numFrames = spectrogram.specs.length;
  const pixelsPerFrame = Math.max(
    1,
    Math.floor(width / Math.max(numFrames, 1)),
  );
  const maxFrequencyBin = spectrogram.fft_size / 2;
  const pixelsPerBin = Math.max(1, Math.floor(height / maxFrequencyBin));

  for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
    const frame = spectrogram.specs[frameIndex];
    for (let bin = 0; bin < maxFrequencyBin; bin++) {
      const magnitude = frame[bin];
      const normalisedMagnitude = (1 + magnitude) / spectrogram.max_amp;
      const colourIntensity = clamp(
        Math.floor(255 * normalisedMagnitude),
        0,
        255,
      );
      ctx.fillStyle = `rgb(${colourIntensity}, ${colourIntensity}, ${colourIntensity})`;
      ctx.fillRect(
        frameIndex * pixelsPerFrame,
        height - (bin + 1) * pixelsPerBin,
        pixelsPerFrame,
        pixelsPerBin,
      );
    }
  }

  overlays.forEach((overlay) =>
    drawOverlay(ctx, overlay, spectrogram, width, height),
  );
};

export const plotPitchTrackValidation = (
  pitchTrackData: PitchTrackObject,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  fs: number,
): void => {
  const spectrogram: SpectrogramData = {
    specs: pitchTrackData.specs,
    fft_size: pitchTrackData.fft_size,
    hop_size: pitchTrackData.hop_size,
    fs,
    max_amp: pitchTrackData.max_amp,
  };

  plotSpectrogram({
    canvas,
    width,
    height,
    spectrogram,
    overlays: [{ f: pitchTrackData.f, t: pitchTrackData.t, color: 'red' }],
  });
};
