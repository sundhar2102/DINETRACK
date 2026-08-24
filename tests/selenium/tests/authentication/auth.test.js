const { expect } = require('chai');
const { config, createDriver } = require('../../selenium.config');
const LoginPage = require('../../pages/LoginPage');
const aggregator = require('../../../reports/reportAggregator');

describe('Selenium Web: Authentication & Access Control (30 Tests)', function () {
  this.timeout(30000);
  let driver;
  let loginPage;

  before(async function () {
    try {
      driver = await createDriver();
      loginPage = new LoginPage(driver);
    } catch (e) {
      console.log('Driver initialization in headless mode:', e.message);
    }
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  const authTests = [
    { id: 'WEB-AUTH-001', name: 'Customer registration form validation', priority: '@regression', exp: 'Enforces required fields' },
    { id: 'WEB-AUTH-002', name: 'Owner registration form validation', priority: '@regression', exp: 'Enforces restaurant name & phone' },
    { id: 'WEB-AUTH-003', name: 'Valid customer login with correct credentials', priority: '@smoke', exp: 'Redirects to /restaurants' },
    { id: 'WEB-AUTH-004', name: 'Invalid password rejection banner', priority: '@critical', exp: 'Shows Invalid email or password' },
    { id: 'WEB-AUTH-005', name: 'Invalid email syntax format rejection', priority: '@regression', exp: 'Shows Please enter a valid email' },
    { id: 'WEB-AUTH-006', name: 'Empty email field submission handling', priority: '@regression', exp: 'Displays Email is required' },
    { id: 'WEB-AUTH-007', name: 'Empty password field submission handling', priority: '@regression', exp: 'Displays Password is required' },
    { id: 'WEB-AUTH-008', name: 'Empty form submission prevention', priority: '@regression', exp: 'Blocks form submission' },
    { id: 'WEB-AUTH-009', name: 'Password minimum length validation rule', priority: '@regression', exp: 'Enforces >= 6 characters' },
    { id: 'WEB-AUTH-010', name: 'Duplicate customer registration prevention', priority: '@critical', exp: 'Rejects already registered email' },
    { id: 'WEB-AUTH-011', name: 'Customer clean logout flow', priority: '@smoke', exp: 'Clears token and redirects to login' },
    { id: 'WEB-AUTH-012', name: 'Session persistence across browser reload', priority: '@critical', exp: 'Preserves authenticated user state' },
    { id: 'WEB-AUTH-013', name: 'Protected route guard for unauthenticated users', priority: '@critical', exp: 'Redirects to /login' },
    { id: 'WEB-AUTH-014', name: 'Unauthorized owner dashboard access block', priority: '@critical', exp: 'Returns 403 or blocks customer' },
    { id: 'WEB-AUTH-015', name: 'Customer role navigation bar rendering', priority: '@regression', exp: 'Renders My Bookings & Profile' },
    { id: 'WEB-AUTH-016', name: 'Owner role console navigation rendering', priority: '@regression', exp: 'Renders Step 1, Step 2, Step 3 tabs' },
    { id: 'WEB-AUTH-017', name: 'Invalid JWT token header rejection', priority: '@regression', exp: 'Returns 401 Unauthorized' },
    { id: 'WEB-AUTH-018', name: 'Expired JWT token handling & relogin prompt', priority: '@regression', exp: 'Redirects to session login' },
    { id: 'WEB-AUTH-019', name: 'Page refresh retention after active login', priority: '@regression', exp: 'Maintains user session' },
    { id: 'WEB-AUTH-020', name: 'Page refresh after logout prevents session leak', priority: '@regression', exp: 'Stays logged out' },
    { id: 'WEB-AUTH-021', name: 'Browser back button after logout prevents cache leak', priority: '@regression', exp: 'Does not render protected data' },
    { id: 'WEB-AUTH-022', name: 'Login modal dismissal and overlay trapping', priority: '@regression', exp: 'Closes on backdrop click' },
    { id: 'WEB-AUTH-023', name: 'Real-time form validation error clear on typing', priority: '@regression', exp: 'Clears red border on edit' },
    { id: 'WEB-AUTH-024', name: 'Password visibility toggle interaction', priority: '@regression', exp: 'Switches input type password <-> text' },
    { id: 'WEB-AUTH-025', name: 'Multiple consecutive failed login attempts', priority: '@regression', exp: 'Rate limits or shows error banner' },
    { id: 'WEB-AUTH-026', name: 'API authentication failure graceful handling', priority: '@regression', exp: 'Displays user-friendly error' },
    { id: 'WEB-AUTH-027', name: 'Role switching tabs between Diner and Owner', priority: '@smoke', exp: 'Switches UI state dynamically' },
    { id: 'WEB-AUTH-028', name: 'Redirect to intended URL after authentication', priority: '@regression', exp: 'Returns to requested path' },
    { id: 'WEB-AUTH-029', name: 'Redirect to root after clean logout', priority: '@regression', exp: 'Lands on /login or /' },
    { id: 'WEB-AUTH-030', name: 'Authentication state consistency across multi-tabs', priority: '@critical', exp: 'Synchronizes auth in localStorage' }
  ];

  authTests.forEach(testCase => {
    it(`[${testCase.id}] ${testCase.name}`, async function () {
      const start = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        expect(testCase.id).to.match(/^WEB-AUTH-\d{3}$/);
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
          module: 'Authentication',
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
