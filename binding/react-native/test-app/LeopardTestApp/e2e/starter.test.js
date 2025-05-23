const testData = require('../test_data.json');

describe('Leopard', () => {
  beforeEach(async () => {
    await device.launchApp({newInstance: true});
  });

  it('should pass all tests', async () => {
    await waitFor(element(by.id('runTests')))
      .toBeVisible()
      .withTimeout(5 * 1000);

    await element(by.id('runTests')).tap();

    await waitFor(element(by.id('testStatus')))
      .not.toExist()
      .withTimeout(12 * 60 * 1000);

    const numTestCases = testData.tests.language_tests.length + testData.tests.diarization_tests.length;
    for (let i = 0; i < numTestCases; i += 1) {
      await waitFor(element(by.id('testResult')).atIndex(i))
        .toExist()
        .withTimeout(60 * 1000);
      await expect(element(by.id('testResult')).atIndex(i)).toHaveText('true');
    }
  });
});
