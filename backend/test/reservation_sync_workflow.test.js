const { getDb } = require('../database/db');
const reservationService = require('../src/services/reservation.service');
const paymentService = require('../src/services/payment.service');
const orderService = require('../src/services/order.service');
const crypto = require('crypto');

async function runTests() {
  console.log('🧪 Starting Reservation ↔ Food Order ↔ Receipt Sync Integration Tests...\n');
  const db = await getDb();

  // Setup test user & restaurant
  const testUserId = crypto.randomUUID();
  const testOwnerId = crypto.randomUUID();
  const testRestId = crypto.randomUUID();
  const testTableId = crypto.randomUUID();
  const testMenuCatId = crypto.randomUUID();
  const testMenuItemId = crypto.randomUUID();

  await db.run(
    `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [testUserId, 'Sync Diner', `diner_${Date.now()}@test.com`, 'hash', 'CUSTOMER']
  );
  await db.run(
    `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [testOwnerId, 'Sync Owner', `owner_${Date.now()}@test.com`, 'hash', 'OWNER']
  );
  await db.run(
    `INSERT INTO restaurants (id, owner_id, name, cuisine, is_open, is_verified, verification_status) VALUES (?, ?, ?, ?, 1, 1, 'APPROVED')`,
    [testRestId, testOwnerId, 'Sync Bistro', 'Multi-Cuisine']
  );
  await db.run(
    `INSERT INTO restaurant_locations (id, restaurant_id, address_line1, city, state, postal_code, latitude, longitude) VALUES (?, ?, '100 Sync St', 'Chennai', 'TN', '600001', 13.0827, 80.2707)`,
    [crypto.randomUUID(), testRestId]
  );
  await db.run(
    `INSERT INTO tables (id, restaurant_id, table_number, capacity, section, status) VALUES (?, ?, 'T-99', 4, 'Main Dining', 'AVAILABLE')`,
    [testTableId, testRestId]
  );
  await db.run(
    `INSERT INTO menu_categories (id, restaurant_id, name, display_order, is_active) VALUES (?, ?, 'Specialties', 1, 1)`,
    [testMenuCatId, testRestId]
  );
  await db.run(
    `INSERT INTO menu_items (id, restaurant_id, category_id, name, price, is_vegetarian, is_available) VALUES (?, ?, ?, 'Butter Paneer', 300, 1, 1)`,
    [testMenuItemId, testRestId, testMenuCatId]
  );

  console.log('✅ Test environment seeded successfully.');

  // =========================================================================
  // TEST 1: Unpaid Reservation + Food Pre-Order Cancellation
  // =========================================================================
  console.log('\n--- Test 1: Unpaid Reservation + Food Pre-Order Cancellation ---');
  const res1 = await reservationService.createReservation({
    restaurantId: testRestId,
    userId: testUserId,
    tableId: testTableId,
    guestCount: 2,
    reservationDate: '2026-09-01',
    reservationTime: '19:30',
    preOrderItems: [
      { id: testMenuItemId, name: 'Butter Paneer', price: 300, quantity: 2 }
    ]
  });

  const tableAfterBooking1 = await db.get('SELECT * FROM tables WHERE id = ?', [testTableId]);
  console.log(`Initial Reservation Status: ${res1.status}, Linked Order: ${res1.order_id}`);

  // Cancel reservation
  const cancelledRes1 = await reservationService.updateReservationStatus(res1.id, 'CANCELLED', testOwnerId, 'Guest requested cancellation');
  
  if (cancelledRes1.status !== 'CANCELLED') {
    throw new Error(`Expected reservation status CANCELLED, got ${cancelledRes1.status}`);
  }
  if (cancelledRes1.order_status !== 'CANCELLED') {
    throw new Error(`Expected linked order status CANCELLED, got ${cancelledRes1.order_status}`);
  }
  
  // Verify order in database
  const dbOrder1 = await db.get('SELECT * FROM orders WHERE id = ?', [res1.order_id]);
  if (dbOrder1.status !== 'CANCELLED') {
    throw new Error(`Expected database order status CANCELLED, got ${dbOrder1.status}`);
  }

  // Verify order_items preserved
  const dbOrderItems1 = await db.query('SELECT * FROM order_items WHERE order_id = ?', [res1.order_id]);
  if (dbOrderItems1.length !== 1 || dbOrderItems1[0].quantity !== 2) {
    throw new Error(`Expected order items preserved (1 item, qty 2), got ${dbOrderItems1.length}`);
  }

  // Verify table is released
  const tableAfterCancel1 = await db.get('SELECT * FROM tables WHERE id = ?', [testTableId]);
  if (tableAfterCancel1.status !== 'AVAILABLE') {
    throw new Error(`Expected table status AVAILABLE, got ${tableAfterCancel1.status}`);
  }

  console.log('✅ Test 1 Passed: Reservation CANCELLED, Linked Order CANCELLED, Items Preserved, Table AVAILABLE.');

  // =========================================================================
  // TEST 2: Paid Reservation + Pre-Order Cancellation (Refund Pending)
  // =========================================================================
  console.log('\n--- Test 2: Paid Reservation + Food Pre-Order Cancellation (Refund Pending) ---');
  const res2 = await reservationService.createReservation({
    restaurantId: testRestId,
    userId: testUserId,
    tableId: testTableId,
    guestCount: 2,
    reservationDate: '2026-09-02',
    reservationTime: '20:00',
    preOrderItems: [
      { id: testMenuItemId, name: 'Butter Paneer', price: 300, quantity: 1 }
    ]
  });

  // Simulate payment completion
  const paymentOrder = await paymentService.createPaymentOrder({
    reservationId: res2.id,
    userId: testUserId
  });
  await paymentService.verifyPayment({
    reservationId: res2.id,
    userId: testUserId,
    razorpayOrderId: paymentOrder.gatewayOrderId,
    razorpayPaymentId: 'pay_test_' + Date.now(),
    razorpaySignature: 'sig_' + Date.now(),
    paymentMethod: 'ONLINE_UPI'
  });

  const res2BeforeCancel = await reservationService.getReservationById(res2.id);
  if (res2BeforeCancel.payment_status !== 'SUCCESS') {
    throw new Error(`Expected payment_status SUCCESS, got ${res2BeforeCancel.payment_status}`);
  }

  // Owner cancels paid reservation
  const cancelledRes2 = await reservationService.updateReservationStatus(res2.id, 'CANCELLED', testOwnerId, 'Kitchen over capacity');
  
  if (cancelledRes2.status !== 'CANCELLED') {
    throw new Error(`Expected reservation status CANCELLED, got ${cancelledRes2.status}`);
  }
  if (cancelledRes2.order_status !== 'CANCELLED') {
    throw new Error(`Expected order status CANCELLED, got ${cancelledRes2.order_status}`);
  }
  if (cancelledRes2.payment_status !== 'REFUND_PENDING') {
    throw new Error(`Expected payment status REFUND_PENDING, got ${cancelledRes2.payment_status}`);
  }

  const paymentRecord = await db.get('SELECT * FROM payments WHERE order_id = ?', [res2.order_id]);
  if (paymentRecord.payment_status !== 'REFUND_PENDING') {
    throw new Error(`Expected database payment status REFUND_PENDING, got ${paymentRecord.payment_status}`);
  }

  console.log('✅ Test 2 Passed: Paid Reservation CANCELLED, Linked Order CANCELLED, Payment Marked REFUND_PENDING.');

  // =========================================================================
  // TEST 3: Reservation Confirmation Flow
  // =========================================================================
  console.log('\n--- Test 3: Reservation Confirmation Flow ---');
  const res3 = await reservationService.createReservation({
    restaurantId: testRestId,
    userId: testUserId,
    tableId: testTableId,
    guestCount: 4,
    reservationDate: '2026-09-03',
    reservationTime: '21:00',
    preOrderItems: [
      { id: testMenuItemId, name: 'Butter Paneer', price: 300, quantity: 3 }
    ]
  });

  const confirmedRes3 = await reservationService.updateReservationStatus(res3.id, 'CONFIRMED', testOwnerId, 'Accepted');
  if (confirmedRes3.status !== 'CONFIRMED') {
    throw new Error(`Expected reservation CONFIRMED, got ${confirmedRes3.status}`);
  }
  if (confirmedRes3.order_status !== 'CONFIRMED') {
    throw new Error(`Expected linked order CONFIRMED, got ${confirmedRes3.order_status}`);
  }

  const tableAfterConfirm = await db.get('SELECT * FROM tables WHERE id = ?', [testTableId]);
  if (tableAfterConfirm.status !== 'RESERVED') {
    throw new Error(`Expected table status RESERVED, got ${tableAfterConfirm.status}`);
  }

  console.log('✅ Test 3 Passed: Reservation CONFIRMED, Linked Order CONFIRMED, Table RESERVED.');

  // =========================================================================
  // TEST 4: Table-Only Reservation (No Pre-Order) Cancellation
  // =========================================================================
  console.log('\n--- Test 4: Table-Only Reservation (No Food Order) Cancellation ---');
  const res4 = await reservationService.createReservation({
    restaurantId: testRestId,
    userId: testUserId,
    tableId: testTableId,
    guestCount: 2,
    reservationDate: '2026-09-04',
    reservationTime: '18:00',
    preOrderItems: []
  });

  const cancelledRes4 = await reservationService.updateReservationStatus(res4.id, 'CANCELLED', testOwnerId, 'Customer cancelled');
  if (cancelledRes4.status !== 'CANCELLED') {
    throw new Error(`Expected reservation CANCELLED, got ${cancelledRes4.status}`);
  }
  if (cancelledRes4.order_id !== null) {
    throw new Error(`Expected order_id null, got ${cancelledRes4.order_id}`);
  }

  console.log('✅ Test 4 Passed: Table-only reservation cancelled cleanly with no orphan orders.');

  console.log('\n🎉 ALL 4 SYNCHRONIZATION INTEGRATION TESTS PASSED (100%)!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
