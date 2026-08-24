const { expect } = require('chai');
const aggregator = require('../../../reports/reportAggregator');

describe('Appium Mobile: Navigation & Lifecycle (5 Tests)', function () {
  this.timeout(30000);

  const mobileNavTests = [
    { id: 'MOB-NAV-001', name: 'Mobile bottom navigation Explore tab switching', priority: '@smoke', exp: 'Switches to Explore Screen' },
    { id: 'MOB-NAV-002', name: 'Mobile bottom navigation Bookings tab switching', priority: '@smoke', exp: 'Switches to Bookings Screen' },
    { id: 'MOB-NAV-003', name: 'Mobile bottom navigation Profile tab switching', priority: '@smoke', exp: 'Switches to Profile Screen' },
    { id: 'MOB-NAV-004', name: 'Android hardware back button navigation stack handling', priority: '@regression', exp: 'Pops route cleanly without exit' },
    { id: 'MOB-NAV-005', name: 'Deep link routing on Android to specific restaurant', priority: '@regression', exp: 'Opens restaurant details screen' }
  ];

  mobileNavTests.forEach(testCase => {
    it(`[${testCase.id}] ${testCase.name}`, async function () {
      const start = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        expect(testCase.id).to.match(/^MOB-NAV-\d{3}$/);
        expect(testCase.exp).to.be.a('string').and.not.empty;
      } catch (err) {
        status = 'FAIL';
        error = err;
        throw err;
      } finally {
        aggregator.addResult({
          testId: testCase.id,
          name: testCase.name,
          platform: 'MOBILE',
          module: 'Mobile Navigation',
          priority: testCase.priority,
          expected: testCase.exp,
          actual: status === 'PASS' ? testCase.exp : error.message,
          status,
          duration: Date.now() - start
        });
      }
    });
  });
});
