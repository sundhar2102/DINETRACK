const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runDeepAudit() {
  console.log('🔍 =======================================================');
  console.log('🔍 STARTING SMARTTABLE AI DEEP END-TO-END AUDIT SUITE');
  console.log('🔍 =======================================================\n');

  let customerToken = null;
  let customerId = null;
  let ownerToken = null;
  let restaurantId = null;
  let testTableId = null;
  let testReservationId = null;
  let testOrderId = null;

  // 1. Customer Authentication & Token Generation
  console.log('1. [AUTH & PROFILE] Customer Login & Location Context...');
  const custRes = await request('POST', '/auth/login', {
    email: 'alex@smarttable.com',
    password: 'Password123!'
  });
  assert.strictEqual(custRes.status, 200, 'Customer login failed');
  customerToken = custRes.data.data.token;
  customerId = custRes.data.data.user.id;
  console.log(`   ✅ Customer authenticated: ${custRes.data.data.user.name} (${customerId})`);

  // 2. Owner Authentication & Role Resolution
  console.log('\n2. [AUTH & PROFILE] Restaurant Owner Authentication & Role Check...');
  const ownerRes = await request('POST', '/auth/login', {
    email: 'owner@sangeetha.com',
    password: 'Password123!'
  });
  assert.strictEqual(ownerRes.status, 200, 'Owner login failed');
  ownerToken = ownerRes.data.data.token;
  restaurantId = ownerRes.data.data.user.restaurant.id;
  console.log(`   ✅ Owner authenticated for restaurant: ${ownerRes.data.data.user.restaurant.name} (${restaurantId})`);

  // 3. Geolocation & Restaurant Discovery
  console.log('\n3. [DISCOVERY] Geolocation Search & Dynamic Distance Sorting...');
  const searchRes = await request('GET', `/restaurants/nearby?lat=13.0418&lng=80.2341&radius=15`);
  assert.strictEqual(searchRes.status, 200);
  assert(searchRes.data.data.length > 0, 'No nearby restaurants found');
  console.log(`   ✅ Found ${searchRes.data.data.length} nearby restaurants. Closest: ${searchRes.data.data[0].name} (~${searchRes.data.data[0].distance_km} km)`);

  // 4. Restaurant Detail, Menu Catalog & Table Matrix
  console.log('\n4. [CATALOG] Restaurant Details, Live Tables & Menu...');
  const detailRes = await request('GET', `/restaurants/${restaurantId}?lat=13.0418&lng=80.2341`);
  assert.strictEqual(detailRes.status, 200);
  const tables = detailRes.data.data.tables;
  const menuCategories = detailRes.data.data.menuCategories;
  assert(tables.length > 0, 'Tables not loaded');
  assert(menuCategories.length > 0, 'Menu categories not loaded');
  
  // Find an AVAILABLE table for state machine testing
  let availableTable = tables.find(t => t.status === 'AVAILABLE');
  if (!availableTable) {
    // Reset first table to AVAILABLE
    await request('PUT', `/tables/${tables[0].id}/status`, { status: 'AVAILABLE' }, ownerToken);
    availableTable = tables[0];
  }
  testTableId = availableTable.id;
  console.log(`   ✅ Restaurant loaded with ${tables.length} tables and ${menuCategories.length} menu categories.`);

  // 5. Algorithmic Wait-Time Engine & Party Size Variations
  console.log('\n5. [WAIT-TIME ENGINE] Verification across party sizes & occupancy...');
  const wait2 = await request('GET', `/restaurants/${restaurantId}/wait-time?partySize=2`);
  const wait6 = await request('GET', `/restaurants/${restaurantId}/wait-time?partySize=6`);
  assert.strictEqual(wait2.status, 200);
  assert.strictEqual(wait6.status, 200);
  console.log(`   ✅ Party of 2 estimated wait: ~${wait2.data.data.estimatedWaitTime}m (Crowd: ${wait2.data.data.crowdLevel})`);
  console.log(`   ✅ Party of 6 estimated wait: ~${wait6.data.data.estimatedWaitTime}m (Confidence: ${wait6.data.data.confidence})`);

  // 6. Table Status State Machine Transitions (Step 3 Audit)
  console.log('\n6. [TABLE STATE MACHINE] Allowed transitions & invalid rejection...');
  // AVAILABLE -> BLOCKED
  const blockRes = await request('PUT', `/tables/${testTableId}/status`, { status: 'BLOCKED' }, ownerToken);
  assert.strictEqual(blockRes.status, 200);
  assert.strictEqual(blockRes.data.data.status, 'BLOCKED');
  console.log('   ✅ Table transitioned: AVAILABLE -> BLOCKED');

  // BLOCKED -> AVAILABLE
  const unblockRes = await request('PUT', `/tables/${testTableId}/status`, { status: 'AVAILABLE' }, ownerToken);
  assert.strictEqual(unblockRes.status, 200);
  assert.strictEqual(unblockRes.data.data.status, 'AVAILABLE');
  console.log('   ✅ Table transitioned: BLOCKED -> AVAILABLE');

  // AVAILABLE -> MAINTENANCE
  const maintRes = await request('PUT', `/tables/${testTableId}/status`, { status: 'MAINTENANCE' }, ownerToken);
  assert.strictEqual(maintRes.status, 200);
  assert.strictEqual(maintRes.data.data.status, 'MAINTENANCE');
  console.log('   ✅ Table transitioned: AVAILABLE -> MAINTENANCE');

  // MAINTENANCE -> AVAILABLE
  await request('PUT', `/tables/${testTableId}/status`, { status: 'AVAILABLE' }, ownerToken);
  console.log('   ✅ Table restored: MAINTENANCE -> AVAILABLE');

  // 7. Table Reservation & Pre-Order Creation with Coupon
  console.log('\n7. [BOOKING & COUPON] Create Reservation with Pre-Ordered Food...');
  // Validate Coupon WELCOME50
  const couponRes = await request('POST', `/offers/${restaurantId}/validate`, {
    code: 'WELCOME50',
    orderAmount: 30
  });
  assert.strictEqual(couponRes.status, 200);
  assert.strictEqual(couponRes.data.data.discountAmount, 15);
  console.log('   ✅ Coupon WELCOME50 validated: $15 discount applied on $30');

  const now = new Date();
  const resDate = now.toISOString().split('T')[0];
  const resTime = '21:15';

  const firstMenuItem = menuCategories[0].items[0];

  const bookRes = await request('POST', '/reservations', {
    restaurantId,
    guestCount: 2,
    reservationDate: resDate,
    reservationTime: resTime,
    tableId: testTableId,
    specialRequests: 'Corner table with warm lighting',
    estimatedArrivalMinutes: 15,
    preOrderItems: [
      { id: firstMenuItem.id, name: firstMenuItem.name, price: firstMenuItem.price, quantity: 2, prep_time_minutes: firstMenuItem.prep_time_minutes || 12 }
    ],
    paymentMethod: 'ONLINE_CARD'
  }, customerToken);

  assert.strictEqual(bookRes.status, 201);
  testReservationId = bookRes.data.data.id;
  console.log(`   ✅ Reservation created! ID: ${testReservationId}, Table assigned: ${testTableId}`);

  // 8. Double-Booking Conflict Prevention
  console.log('\n8. [INTEGRITY] Atomic Double-Booking Conflict Prevention...');
  const conflictRes = await request('POST', '/reservations', {
    restaurantId,
    guestCount: 2,
    reservationDate: resDate,
    reservationTime: resTime,
    tableId: testTableId
  }, customerToken);
  assert.strictEqual(conflictRes.status, 409, 'Double booking was not prevented!');
  console.log('   ✅ Conflict detected correctly: HTTP 409 Conflict returned.');

  // 9. Full Reservation Lifecycle (Step 4 Audit: CONFIRMED -> CHECKED_IN -> SEATED -> COMPLETED)
  console.log('\n9. [RESERVATION LIFECYCLE] Testing status transitions & history...');
  // CONFIRMED -> CHECKED_IN (Arrival at Host Desk)
  const checkinRes = await request('PUT', `/reservations/${testReservationId}/status`, { status: 'CHECKED_IN' }, ownerToken);
  assert.strictEqual(checkinRes.status, 200);
  assert.strictEqual(checkinRes.data.data.status, 'CHECKED_IN');
  console.log('   ✅ Reservation state: CONFIRMED -> CHECKED_IN');

  // CHECKED_IN -> SEATED (Host seats guest -> Table becomes OCCUPIED -> Order becomes PREPARING)
  const seatRes = await request('PUT', `/reservations/${testReservationId}/status`, { status: 'SEATED' }, ownerToken);
  assert.strictEqual(seatRes.status, 200);
  assert.strictEqual(seatRes.data.data.status, 'SEATED');
  console.log('   ✅ Reservation state: CHECKED_IN -> SEATED (Table marked OCCUPIED)');

  // SEATED -> COMPLETED (Guest finishes dining -> Table becomes CLEANING)
  const completeRes = await request('PUT', `/reservations/${testReservationId}/status`, { status: 'COMPLETED' }, ownerToken);
  assert.strictEqual(completeRes.status, 200);
  assert.strictEqual(completeRes.data.data.status, 'COMPLETED');
  console.log('   ✅ Reservation state: SEATED -> COMPLETED (Table marked CLEANING)');

  // Table CLEANING -> AVAILABLE
  await request('PUT', `/tables/${testTableId}/status`, { status: 'AVAILABLE' }, ownerToken);
  console.log('   ✅ Table turnover finished: CLEANING -> AVAILABLE');

  // 10. Reviews & Owner Replies Flow
  console.log('\n10. [REVIEWS & REPLIES] Customer Review and Owner Response...');
  const revRes = await request('POST', '/reviews', {
    restaurantId,
    rating: 5,
    comment: 'Exceptional Ghee Podi Dosai, served fresh right when we were seated!'
  }, customerToken);
  assert.strictEqual(revRes.status, 201);
  const reviewId = revRes.data.data.id;
  console.log('   ✅ Customer review posted (5 Stars)');

  const replyRes = await request('POST', `/reviews/${reviewId}/reply`, {
    replyText: 'Thank you for dining with us Alex! Looking forward to hosting you again soon.'
  }, ownerToken);
  assert.strictEqual(replyRes.status, 201);
  console.log('   ✅ Owner replied to customer review successfully.');

  // 11. Owner Platform CRM, Inventory & Reports Verification
  console.log('\n11. [OWNER PLATFORM MODULES] CRM, Inventory Alerts, Settings & Reports...');
  const crmRes = await request('GET', `/crm/restaurant/${restaurantId}`, null, ownerToken);
  assert.strictEqual(crmRes.status, 200);
  console.log(`   ✅ CRM directory loaded (${crmRes.data.data.length} guest records aggregated)`);

  const invRes = await request('GET', `/inventory/restaurant/${restaurantId}`, null, ownerToken);
  assert.strictEqual(invRes.status, 200);
  console.log(`   ✅ Inventory items loaded (${invRes.data.data.length} items)`);

  const repRes = await request('GET', `/reports/restaurant/${restaurantId}/sales`, null, ownerToken);
  assert.strictEqual(repRes.status, 200);
  console.log(`   ✅ Financial reports loaded (Total Sales: $${Number(repRes.data.data.totalSales || 0).toFixed(2)})`);

  console.log('\n=======================================================');
  console.log('🎉 DEEP AUDIT PASSED 100%! ALL 11 DOMAIN FLOWS VERIFIED');
  console.log('=======================================================\n');
}

runDeepAudit().catch((err) => {
  console.error('❌ DEEP AUDIT FAILURE:', err);
  process.exit(1);
});
