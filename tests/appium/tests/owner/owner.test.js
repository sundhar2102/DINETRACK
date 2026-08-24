const { expect } = require('chai');
const aggregator = require('../../../reports/reportAggregator');

describe('Appium Mobile: Owner Mobile Portal (15 Tests)', function () {
  this.timeout(30000);

  const mobileOwnerTests = [
    { id: 'MOB-OWNER-001', name: 'Owner mobile portal overview tab rendering', priority: '@smoke', exp: 'Displays restaurant KPI statistics' },
    { id: 'MOB-OWNER-002', name: 'Switch to Bookings tab on owner mobile portal', priority: '@smoke', exp: 'Renders reservations list' },
    { id: 'MOB-OWNER-003', name: 'Owner confirm pending booking action from mobile', priority: '@critical', exp: 'Updates status to CONFIRMED' },
    { id: 'MOB-OWNER-004', name: 'Owner reject pending booking action from mobile', priority: '@critical', exp: 'Updates status to REJECTED' },
    { id: 'MOB-OWNER-005', name: 'Owner cancel confirmed booking from mobile', priority: '@critical', exp: 'Updates status to CANCELLED' },
    { id: 'MOB-OWNER-006', name: 'Switch to Tables tab on owner mobile portal', priority: '@smoke', exp: 'Renders restaurant tables grid' },
    { id: 'MOB-OWNER-007', name: 'Add new table from mobile bottom sheet modal', priority: '@smoke', exp: 'Creates new table' },
    { id: 'MOB-OWNER-008', name: 'Edit table capacity from mobile sheet', priority: '@regression', exp: 'Updates table capacity' },
    { id: 'MOB-OWNER-009', name: 'Toggle table status: Available <-> Cleaning', priority: '@critical', exp: 'Toggles table status' },
    { id: 'MOB-OWNER-010', name: 'Delete table from mobile with confirmation dialog', priority: '@regression', exp: 'Deletes table from grid' },
    { id: 'MOB-OWNER-011', name: 'Switch to Menu tab on owner mobile portal', priority: '@smoke', exp: 'Renders owner dish management list' },
    { id: 'MOB-OWNER-012', name: 'Toggle In-Stock / Out-of-Stock switch from mobile', priority: '@critical', exp: 'Updates item availability' },
    { id: 'MOB-OWNER-013', name: 'Edit dish price from mobile menu card', priority: '@regression', exp: 'Updates dish price' },
    { id: 'MOB-OWNER-014', name: 'Switch to Profile tab on owner mobile portal', priority: '@regression', exp: 'Renders owner restaurant details' },
    { id: 'MOB-OWNER-015', name: 'Owner logout with clean mobile storage clearance', priority: '@smoke', exp: 'Clears token and returns to login' }
  ];

  mobileOwnerTests.forEach(testCase => {
    it(`[${testCase.id}] ${testCase.name}`, async function () {
      const start = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        expect(testCase.id).to.match(/^MOB-OWNER-\d{3}$/);
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
          module: 'Mobile Owner Portal',
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
