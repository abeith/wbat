export class WaveFile {
  fromScratch(): void {}
  setTag(): void {}
  toDataURI(): string {
    return 'data:audio/wav;base64,';
  }
  toBuffer(): Uint8Array {
    return new Uint8Array();
  }
}
