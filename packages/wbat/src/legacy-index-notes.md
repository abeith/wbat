```js
  // async trackPitch(
  //   source: AudioBuffer | string,
  //   fftSize: number = 2048,
  //   hopSize: number = 1024,
  //   adj: boolean = true,
  //   hann: boolean = true,
  // ): Promise<PitchTrackObject> {
  //   const buffer = await this.prepareAudioBuffer(source);
  //   const pcmBuffer = new Float32Array(buffer.length);
  //   buffer.copyFromChannel(pcmBuffer, 0);

  //   const numFrames = Math.floor((pcmBuffer.length - fftSize) / hopSize) + 1;
  //   console.log(
  //     `numFrames: ${numFrames}\npcmBuffer.length: ${pcmBuffer.length}\nfftSize: ${fftSize}\nhopSize: ${hopSize}`,
  //   );
  //   const frames = new Array<Float32Array>(numFrames);
  //   const frequencyEstimates = new Array<number>(numFrames);
  //   const time = new Array<number>(numFrames);
  //   const specs = new Array<Float32Array>(numFrames);

  //   const window = this.hann(fftSize);

  //   for (let i = 0; i < numFrames; i++) {
  //     const start = i * hopSize;
  //     const frame = new Float32Array(fftSize);

  //     // Apply window to frame
  //     for (let j = 0; j < fftSize; j++) {
  //       frame[j] = pcmBuffer[start + j] * window[j];
  //     }

  //     frames[i] = frame;
  //     const specSlice = this.fftPeak(frame, adj, hann);
  //     frequencyEstimates[i] = specSlice.peakF;
  //     specs[i] = specSlice.spec;
  //     time[i] = ((i + 0.5) * hopSize) / this.fs;
  //   }

  //   return {
  //     t: time,
  //     f: frequencyEstimates,
  //     specs: specs,
  //     fft_size: fftSize,
  //     hop_size: hopSize,
  //   };
  // }

  // async detectPitch(source: string | AudioBuffer): Promise<number> {
  //   const buffer = await this.prepareAudioBuffer(source);
  //   const pcmBuffer = new Float32Array(buffer.length);
  //   buffer.copyFromChannel(pcmBuffer, 0);
  //   const fftSize = 2048;
  //   const signal = new Float32Array(fftSize);
  //   for (let i = 0; i < fftSize; i++) {
  //     signal[i] = pcmBuffer[i];
  //   }

  //   const res = this.fftPeak(signal, true, true);
  //   console.log(res);
  //   return res.f;
  // }

  // fftPeak(signal: Float32Array, adj: boolean, hann: boolean): SpectralSlice {
  //   const fftSize = signal.length;

  //   if (hann) {
  //     signal = this.applyHanningWindow(signal);
  //   }

  //   const f = new FFT(fftSize);
  //   const out = f.createComplexArray();
  //   f.realTransform(out, signal);
  //   const fftData = new Float32Array(out);

  //   // 440Hz test tone results
  //   // 444.45094921196596 without hanning
  //   // 441.0958939883329 with hanning
  //   let spec = this.calculateMagnitudes(fftData);
  //   // 443.4005408155781 without hanning
  //   // 439.63231287348106 with hanning
  //   // AnalyserNode method gave me 439.871846149111
  //   spec = spec.map((x: number): number => Math.log2(x));

  //   const i = spec.indexOf(Math.max(...spec));

  //   if (adj) {
  //     const offset = this.calculateBinOffset(spec.slice(i - 1, i + 2));
  //     const f_adj = (this.fs * (i + offset)) / fftSize;

  //     return {
  //       f: f_adj,
  //       spec: spec,
  //     };
  //   }

  //   return {
  //     f: (this.fs * i) / fftSize,
  //     spec: spec,
  //   };
  // }

  // async detectPitch(source: string | AudioBuffer): Promise<void> {
  // 	let fftSize = 2048 * 1;
  // 	let buffer = await this.prepareAudioBuffer(source);
  // 	const offlineAudioContext = new OfflineAudioContext(1, fftSize, this.fs);
  // 	const audioSource = offlineAudioContext.createBufferSource();
  // 	const analyser = offlineAudioContext.createAnalyser();
  // 	analyser.fftSize = fftSize;
  // 	const bufferLength = analyser.frequencyBinCount;
  // 	const dataArray = new Float32Array(analyser.frequencyBinCount);
  //     audioSource.buffer = buffer
  //     audioSource.connect(offlineAudioContext.destination);
  // 	let duration = fftSize / this.fs;
  // 	audioSource.start(0, 0, fftSize/this.fs);
  // 	let renderedBuffer = await offlineAudioContext.startRendering();
  // 	console.log(renderedBuffer);
  // 	const sourceSlice = offlineAudioContext.createBufferSource();
  // 	sourceSlice.buffer = renderedBuffer;
  // 	sourceSlice.connect(analyser);
  // 	sourceSlice.start();
  // 	analyser.getFloatFrequencyData(dataArray);
  // 	await offlineAudioContext.startRendering();
  // 	console.log(dataArray);

  // 	// analyser.getFloatFrequencyData(dataArray);
  // 	// let i = dataArray.indexOf(Math.max(...dataArray));

  // 	// function calculateBinOffset(left: number, peak: number, right: number): number {
  // 	//     // Applying the quadratic interpolation formula
  // 	//     const a = left;
  // 	//     const b = peak;
  // 	//     const c = right;

  // 	//     const p = (a - c) / (2 * (a - 2 * b + c));
  // 	//     return p;
  // 	// }

  // 	// const p_left = dataArray[i-1];
  // 	// const p_peak = dataArray[i];
  // 	// const p_right = dataArray[i+1];
  // 	// const offset = calculateBinOffset(p_left, p_peak, p_right);
  // 	// const f_adj = this.fs * (i + offset) / fftSize;
  // 	// console.log(`Interpolated frequency: ${f_adj}\nfftSize: ${fftSize}`);
  // 	// let f_lower = this.fs * (i-1) / fftSize;

  // 	// let f_peak = this.fs * i / fftSize;
  // 	// let p_peak = dataArray[i] - Math.min(...dataArray);
  // 	// let f_upper = this.fs * (i+1) / fftSize;
  // 	// let p_upper = dataArray[i+1] - Math.min(...dataArray);
  // 	// let f_w_mean = ((f_lower * p_lower) + (f_peak * p_peak) + (f_upper * p_upper)) / (p_lower + p_peak + p_upper);
  // 	// console.log(dataArray);
  // 	// console.log(`peak bin: ${i}\nfft size: ${analyser.fftSize}\nfs: ${this.fs}\npeak: ${f_peak}\nweighted mean: ${f_w_mean}`);
  // }

```
