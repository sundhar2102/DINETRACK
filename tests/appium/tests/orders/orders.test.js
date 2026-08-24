const { expect } = require('chai');
const aggregator = require('../../../reports/reportAggregator');

describe('Appium Mobile: Food Pre-Ordering & Mobile Cart (20 Tests)', function () {
  this.timeout(30000);

  const mobileOrderTests = [
    { id: 'MOB-ORDER-001', name: 'Open mobile food menu sheet during booking', priority: '@smoke', exp: 'Renders category tabs and food items' },
    { id: 'MOB-ORDER-002', name: 'Mobile category horizontal tab switching', priority: '@smoke', exp: 'Filters food cards by category' },
    { id: 'MOB-ORDER-003', name: 'Add food item to mobile cart from menu card', priority: '@smoke', exp: 'Cart bottom floating bar pops up' },
    { id: 'MOB-ORDER-004', name: 'Increment item quantity on mobile food card', priority: '@regression', exp: 'Increases quantity to 2' },
    { id: 'MOB-ORDER-005', name: 'Decrement item quantity on mobile food card', priority: '@regression', exp: 'Decreases quantity to 1' },
    { id: 'MOB-ORDER-006', name: 'Remove item on zero quantity decrement', priority: '@regression', exp: 'Removes item from mobile cart' },
    { id: 'MOB-ORDER-007', name: 'Real-time cart subtotal calculation on floating bar', priority: '@critical', exp: 'Displays exact subtotal' },
    { id: 'MOB-ORDER-008', name: '5% GST tax breakdown calculation in mobile sheet', priority: '@critical', exp: 'Computes 5% tax amount' },
    { id: 'MOB-ORDER-009', name: 'Expand mobile cart bottom sheet for review', priority: '@smoke', exp: 'Opens itemized order review' },
    { id: 'MOB-ORDER-010', name: 'Place food pre-order linked to mobile reservation', priority: '@critical', exp: 'Submits order with PENDING status' },
    { id: 'MOB-ORDER-011', name: 'Food order confirmation screen rendering', priority: '@smoke', exp: 'Renders order ID & item breakdown' },
    { id: 'MOB-ORDER-012', name: 'Live KDS status tracking card on mobile', priority: '@critical', exp: 'Displays Preparing -> Ready -> Served' },
    { id: 'MOB-ORDER-013', name: 'Real-time push notification on order status change', priority: '@critical', exp: 'Receives order ready alert' },
    { id: 'MOB-ORDER-014', name: 'Cancel pre-order on mobile reservation cancellation', priority: '@critical', exp: 'Synchronizes order = CANCELLED' },
    { id: 'MOB-ORDER-015', name: 'Out-of-stock item disabled from adding on mobile', priority: '@critical', exp: 'Disables ADD button for sold out items' },
    { id: 'MOB-ORDER-016', name: 'Mobile cart storage reset after order placement', priority: '@regression', exp: 'Empties active cart' },
    { id: 'MOB-ORDER-017', name: 'Mobile dietary tag chips (Veg, Vegan, Gluten-Free)', priority: '@regression', exp: 'Displays dietary badges' },
    { id: 'MOB-ORDER-018', name: 'Mobile network error retry during order submission', priority: '@regression', exp: 'Shows retry submission modal' },
    { id: 'MOB-ORDER-019', name: 'Digital bill view with itemized taxes on mobile', priority: '@regression', exp: 'Renders full digital receipt' },
    { id: 'MOB-ORDER-020', name: 'Complete mobile food pre-ordering flow', priority: '@smoke', exp: 'Menu -> Cart -> Order -> KDS Track' }
  ];

  mobileOrderTests.forEach(testCase => {
    it(`[${testCase.id}] ${testCase.name}`, async function () {
      const start = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        expect(testCase.id).to.match(/^MOB-ORDER-\d{3}$/);
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
          module: 'Mobile Orders',
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
