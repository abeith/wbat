import 'jest-puppeteer';
import 'expect-puppeteer';

describe('playback example (manual headed)', (): void => {
  beforeAll(async (): Promise<void> => {
    await page.goto('http://localhost:3000/play.html');
  });

  it('loads AudioData from file and replays it', async (): Promise<void> => {
    const playFileButton = await page.$('#play-file');
    await playFileButton!.click();

    await page.waitForFunction(() => (window as any).playbackReady === true, {
      timeout: 60000,
    });

    const playAudioDataButton = await page.$('#play-audio-data');
    const displayValue = await page.evaluate(
      (el) => window.getComputedStyle(el).display,
      playAudioDataButton,
    );
    expect(displayValue).not.toBe('none');

    await playAudioDataButton!.click();

    await page.waitForFunction(() => (window as any).playbackPlayed === true, {
      timeout: 60000,
    });
  });
});
