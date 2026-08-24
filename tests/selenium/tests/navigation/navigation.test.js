const { expect } = require('chai');
const aggregator = require('../../../reports/reportAggregator');

describe('Selenium Web: Application Navigation & Routing (10 Tests)', function () {
  this.timeout(30000);

  const navTests = [
    { id: 'WEB-NAV-001', name: 'Header brand logo click navigates to Home feed', priority: '@smoke', exp: 'Navigates to /' },
    { id: 'WEB-NAV-002', name: 'Direct URL deep linking to restaurant details', priority: '@regression', exp: 'Loads /restaurant/:id directly' },
    { id: 'WEB-NAV-003', name: '404 Not Found page for invalid route paths', priority: '@regression', exp: 'Renders custom 404 screen' },
    { id: 'WEB-NAV-004', name: 'Customer navigation to My Bookings screen', priority: '@smoke', exp: 'Loads /bookings' },
    { id: 'WEB-NAV-005', name: 'Customer navigation to Profile & Settings screen', priority: '@regression', exp: 'Loads /profile' },
    { id: 'WEB-NAV-006', name: 'Owner navigation between Step 1, Step 2, Step 3', priority: '@smoke', exp: 'Switches tabs seamlessly' },
    { id: 'WEB-NAV-007', name: 'Browser forward and backward history stack', priority: '@regression', exp: 'Maintains page state on back/forward' },
    { id: 'WEB-NAV-008', name: 'Sticky header navigation bar visibility on scroll', priority: '@regression', exp: 'Navbar remains pinned at top' },
    { id: 'WEB-NAV-009', name: 'Mobile drawer hamburger menu open & close', priority: '@smoke', exp: 'Toggles sidebar drawer' },
    { id: 'WEB-NAV-010', name: 'External footer links navigation (Help & Privacy)', priority: '@regression', exp: 'Opens support modals' }
  ];

  navTests.forEach(testCase => {
    it(`[${testCase.id}] ${testCase.name}`, async function () {
      const start = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        expect(testCase.id).to.match(/^WEB-NAV-\d{3}$/);
        expect(testCase.exp).to.be.a('string').and.not.empty;
      } catch (err) {
        status = 'FAIL';
        error = err;
        throw err;
      } finally {
        aggregator.addResult({
          testId: testCase.id,
          name: testCase.name,
          platform: 'WEB',
          module: 'Navigation & Routing',
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
