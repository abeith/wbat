import 'jest-puppeteer';
import 'expect-puppeteer';

describe('latencyTest', (): void => {
  // beforeAll(async (): Promise<void> => {

  // });

  // it('should display "Latency unit test" text on page', async (): Promise<void> => {
  // 	await expect(page).toMatchTextContent(/Latency unit test/);
  // });

  it('4kHz sweep should detect 100 ms delay', async (): Promise<void> => {
    await page.goto(
      'http://localhost:3000/latency.html?sweep=4&delay=100',
    );
    const button = await page.$('#run-sim');
    await button!.click();
    await page.screenshot({ path: 'latency_result1.png' });
    const unitTestValue = await page.evaluate((): number => unitTestValue);
    expect(unitTestValue).toEqual(100);
  });

  it('8kHz sweep should detect 100 ms delay', async (): Promise<void> => {
    await page.goto(
      'http://localhost:3000/latency.html?sweep=8&delay=100',
    );
    const button = await page.$('#run-sim');
    await button!.click();
    await page.screenshot({ path: 'latency_result2.png' });
    const unitTestValue = await page.evaluate((): number => unitTestValue);
    expect(unitTestValue).toEqual(100);
  });

  it('16kHz sweep should detect 100 ms delay', async (): Promise<void> => {
    await page.goto(
      'http://localhost:3000/latency.html?sweep=16&delay=100',
    );
    const button = await page.$('#run-sim');
    await button!.click();
    await page.screenshot({ path: 'latency_result3.png' });
    const unitTestValue = await page.evaluate((): number => unitTestValue);
    expect(unitTestValue).toEqual(100);
  });

  // // This is impracticle unless puppeteer is headed
  // it('should produce a result', async (): Promise<void> => {
  // 	const context = browser.defaultBrowserContext();
  //     await context.overridePermissions('http://localhost:8000', ['microphone']);
  // 	const button = await page.$('#run');
  // 	await button!.click();
  // 	// await jestPuppeteer.debug();
  // 	await expect(page).toMatchTextContent(/Delay/);
  // })
});
