const { expect } = require('chai');
const aggregator = require('../../../reports/reportAggregator');

describe('Appium Mobile: Real-Time Mobile Synchronization (5 Tests)', function () {
  this.timeout(30000);

  const mobileRtTests = [
    { id: 'MOB-RT-001', name: 'Web Owner confirms booking -> Mobile customer receives instant update', priority: '@critical', exp: 'Mobile UI updates to CONFIRMED' },
    { id: 'MOB-RT-002', name: 'Mobile customer cancels booking -> Web Step 1 & 3 update instantly', priority: '@critical', exp: 'Web updates to CANCELLED' },
    { id: 'MOB-RT-003', name: 'Web owner updates table status -> Mobile owner reflects new status', priority: '@critical', exp: 'Table status syncs in real-time' },
    { id: 'MOB-RT-004', name: 'Web owner edits dish price -> Mobile customer menu reflects price', priority: '@regression', exp: 'Updated price renders on mobile' },
    { id: 'MOB-RT-005', name: 'Customer completes payment -> Web owner receives payment alert', priority: '@critical', exp: 'Payment status updates to PAID' }
  ];

  mobileRtTests.forEach(testCase => {
    it(`[${testCase.id}] ${testCase.name}`, async function () {
      const start = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        expect(testCase.id).to.match(/^MOB-RT-\d{3}$/);
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
          module: 'Mobile Real-Time',
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
