import 'jest-puppeteer';
import 'expect-puppeteer';

describe('detectPitch', (): void => {
  beforeAll(async (): Promise<void> => {
    await page.goto('http://localhost:3000/pitch-detect.html');
  });

  it('should display "detection" text on page', async (): Promise<void> => {
    await expect(page).toMatchTextContent(/detection/);
  });

  it('should detect 440Hz', async (): Promise<void> => {
    const button = await page.$('#run_a4');

    await button!.click();
    // await expect(page).toMatchTextContent(/Detected pitch: 439.65Hz/);
    await page.screenshot({ path: 'pitch_result.png' });
    const unitTestValue = await page.evaluate((): number => unitTestValue);
    expect(unitTestValue).toEqual(440);
  });
});
