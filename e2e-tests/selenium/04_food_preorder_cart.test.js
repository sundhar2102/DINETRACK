/**
 * Suite 04: Food Pre-Order, Cart & Price Math
 * 18 Test Cases
 */
module.exports = {
  suiteId: 'WEB-FOOD-04',
  suiteName: 'Food Pre-Order & Cart Math',
  platform: 'Web',
  tests: [
    {
      id: 'ST-WEB-FOOD-001',
      title: 'Render Food Pre-Order Menu in Booking Flow',
      description: 'Verify categorized menu tabs (Starters, Mains, Desserts, Beverages) load properly',
      expected: 'Menu categories and item cards rendered with prices and images',
    },
    {
      id: 'ST-WEB-FOOD-002',
      title: 'Add Single Item to Food Pre-Order Cart',
      description: 'Click "ADD" on Paneer Butter Masala',
      expected: 'Item added to cart with quantity = 1, floating cart badge updates',
    },
    {
      id: 'ST-WEB-FOOD-003',
      title: 'Increment Item Quantity in Cart',
      description: 'Click "+" on Paneer Butter Masala to increase quantity to 3',
      expected: 'Quantity updates to 3 and item total updates to (Price * 3)',
    },
    {
      id: 'ST-WEB-FOOD-004',
      title: 'Decrement Item Quantity in Cart',
      description: 'Click "-" on Paneer Butter Masala to reduce quantity to 2',
      expected: 'Quantity updates to 2 and item total recalculated accurately',
    },
    {
      id: 'ST-WEB-FOOD-005',
      title: 'Remove Item from Cart on Zero Quantity',
      description: 'Click "-" when quantity is 1',
      expected: 'Item is removed from the cart completely',
    },
    {
      id: 'ST-WEB-FOOD-006',
      title: 'Add Multiple Items Across Different Categories',
      description: 'Add 1 Starter (Paneer Tikka), 2 Mains (Dal Makhani), 2 Beverages (Mango Lassi)',
      expected: 'Cart contains all 3 unique items with accurate counts',
    },
    {
      id: 'ST-WEB-FOOD-007',
      title: 'Real-Time Subtotal Calculation',
      description: 'Verify sum of (item_price * quantity) matches Subtotal line item exactly',
      expected: 'Subtotal is mathematically exact without rounding errors',
    },
    {
      id: 'ST-WEB-FOOD-008',
      title: 'GST / Tax Calculation (5% Food Tax)',
      description: 'Verify 5% GST is computed on subtotal: (subtotal * 0.05)',
      expected: 'GST line item equals exactly 5% of subtotal',
    },
    {
      id: 'ST-WEB-FOOD-009',
      title: 'Total Bill Calculation',
      description: 'Verify Total = Subtotal + GST',
      expected: 'Total bill matches sum of subtotal and taxes',
    },
    {
      id: 'ST-WEB-FOOD-010',
      title: 'Special Cooking Instructions on Cart Item',
      description: 'Add note to Dal Makhani: "Extra butter, medium spicy"',
      expected: 'Cooking instructions attached to order line item payload',
    },
    {
      id: 'ST-WEB-FOOD-011',
      title: 'Out-of-Stock Item Disabled from Adding',
      description: 'Verify items marked is_available = false cannot be added to cart',
      expected: '"Out of Stock" badge displayed and ADD button disabled',
    },
    {
      id: 'ST-WEB-FOOD-012',
      title: 'Clear Whole Pre-Order Cart',
      description: 'Click "Clear Cart" button and confirm empty state',
      expected: 'All items removed, cart subtotal resets to ₹0',
    },
    {
      id: 'ST-WEB-FOOD-013',
      title: 'Pre-Order Cart Persistence During Tab Switch',
      description: 'Switch between Menu categories and verify cart items remain intact',
      expected: 'Cart state preserved across category navigation',
    },
    {
      id: 'ST-WEB-FOOD-014',
      title: 'Veg / Non-Veg Indicator Icons',
      description: 'Verify green dot icon for Veg items and red dot icon for Non-Veg items',
      expected: 'Correct dietary symbol rendered for each menu item',
    },
    {
      id: 'ST-WEB-FOOD-015',
      title: 'Estimated Preparation Time Aggregation',
      description: 'Calculate maximum preparation time among all cart items',
      expected: 'Displays estimated kitchen prep time (e.g. 15-20 mins)',
    },
    {
      id: 'ST-WEB-FOOD-016',
      title: 'Link Pre-Order Cart with Reservation Payload',
      description: 'Proceed to checkout with both Table Reservation and Food Order items',
      expected: 'Combined payload containing reservation_id and items array created',
    },
    {
      id: 'ST-WEB-FOOD-017',
      title: 'Backend Validation of Food Order Pricing',
      description: 'Submit order to backend and verify backend re-validates item prices from DB',
      expected: 'Backend prevents client-side price tampering and validates totals',
    },
    {
      id: 'ST-WEB-FOOD-018',
      title: 'Order Summary Itemized Breakdown on Review Screen',
      description: 'Verify final pre-checkout screen displays all items, quantities, and totals',
      expected: 'Itemized summary rendered with clear review details',
    },
  ],
};
