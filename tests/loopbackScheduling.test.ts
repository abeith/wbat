import 'jest-puppeteer';
import 'expect-puppeteer';

describe('loopback scheduling (manual headed)', (): void => {
  beforeAll(async (): Promise<void> => {
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:3000', ['microphone']);
    await page.goto('http://localhost:3000/loopback-scheduling.html');
  });

  const runButton = async (buttonId: string, label: string) => {
    await page.evaluate(() => {
      const log = document.getElementById('log');
      if (log) {
        log.textContent = '';
      }
      const results = document.getElementById('results');
      if (results) {
        results.textContent = '';
      }
    });

    const button = await page.$(buttonId);
    await button!.click();

    await page.waitForFunction(
      (expectedLabel) => {
        const results = document.getElementById('results');
        if (!results?.textContent) {
          return false;
        }
        try {
          const parsed = JSON.parse(results.textContent);
          return (
            typeof parsed.label === 'string' &&
            parsed.label.includes(expectedLabel) &&
            typeof parsed.status === 'string'
          );
        } catch {
          return false;
        }
      },
      { timeout: 120000 },
      label,
    );

    return page.evaluate(() => {
      const logText = document.getElementById('log')?.textContent || '';
      const results = document.getElementById('results')?.textContent || '{}';
      const parsed = JSON.parse(results);
      return { logText, ...parsed };
    });
  };

  it('absolute prepared keeps duration and aligned stimulus', async (): Promise<void> => {
    const result = await runButton(
      '#test-absolute-prepared',
      'Absolute start/end (prepared',
    );
    expect(result.status).toBe('PASS');
    expect(result.recordedDuration).toBeGreaterThanOrEqual(result.intendedDuration);
    expect(result.stimAligned).toBe(true);

    if (result.stimLength !== null && result.stimLength >= result.inputLength) {
      const expectedTrailingFrames = Math.round(
        (result.recordedDuration - result.intendedDuration) * result.fs,
      );
      expect(result.trailingFrames).toBe(expectedTrailingFrames);
    }
  });

  it('relative delay + duration keeps alignment', async (): Promise<void> => {
    const result = await runButton('#test-relative', 'Delay + duration');
    expect(result.status).toBe('PASS');
    expect(result.recordedDuration).toBeGreaterThanOrEqual(result.intendedDuration);
    expect(Math.abs(result.stimInputDelta)).toBeLessThanOrEqual(1);
  });

  it('relative delay + duration records >1s windows', async (): Promise<void> => {
    const result = await runButton('#test-relative-long', 'Delay + duration (2s)');
    expect(result.status).toBe('PASS');
    expect(result.recordedDuration).toBeGreaterThanOrEqual(result.intendedDuration);
    expect(result.intendedDuration).toBeGreaterThan(1);
    expect(Math.abs(result.stimInputDelta)).toBeLessThanOrEqual(1);
  });

  it('quantised start/end keeps alignment', async (): Promise<void> => {
    const result = await runButton('#test-quantized', 'Quantised start/end');
    expect(result.status).toBe('PASS');
    expect(result.recordedDuration).toBeGreaterThanOrEqual(result.intendedDuration);
    expect(Math.abs(result.stimInputDelta)).toBeLessThanOrEqual(1);
  });

  it('half-sample offset produces a 1-sample misalignment', async (): Promise<void> => {
    const result = await runButton('#test-half-sample', 'Quantised + 0.5/fs');
    expect(result.status).toBe('PASS');
    expect(result.recordedDuration).toBeGreaterThanOrEqual(result.intendedDuration);
    const hasIntegerShift =
      typeof result.stimInputDelta === 'number' && result.stimInputDelta !== 0;
    const hasFractionalShift =
      typeof result.stimFracDelay === 'number' &&
      Math.abs(result.stimFracDelay) >= 0.25;
    expect(hasIntegerShift || hasFractionalShift).toBe(true);
  });

  it('tight start keep duration preserves the intended window', async (): Promise<void> => {
    const result = await runButton('#test-past-duration', 'Tight start, keep duration');
    expect(result.status).toBe('PASS');
    expect(result.recordedDuration).toBeGreaterThanOrEqual(result.intendedDuration);
  });

  it('tight start keep endTime records a shorter window', async (): Promise<void> => {
    const result = await runButton('#test-past-end', 'Tight start, keep endTime');
    expect(result.status).toBe('EXPECTED_FAIL');
    expect(result.error).toBeTruthy();
  });
});
