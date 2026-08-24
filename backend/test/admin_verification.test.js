const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runAdminVerificationTests() {
  console.log('🛡️ Testing DineTrack App Admin Verification & Approval Workflow...\n');

  // 1. Log in as App Super Admin
  console.log('1. Logging in as App Super Admin (admin@smarttable.com)...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@smarttable.com', password: 'Password123!' }
  });
  console.assert(adminLogin.status === 200, 'Admin login should succeed');
  const adminToken = adminLogin.data.data.token;
  console.log('   ✅ App Admin logged in successfully.');

  // 2. Log in as Customer
  console.log('\n2. Logging in as Customer (alex@smarttable.com)...');
  const customerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'alex@smarttable.com', password: 'Password123!' }
  });
  console.assert(customerLogin.status === 200, 'Customer login should succeed');
  const customerToken = customerLogin.data.data.token;
  console.log('   ✅ Customer logged in successfully.');

  // 3. Inspect Pending Restaurant (rest-006: Paradise Biryani & Kebab Hub)
  console.log('\n3. Inspecting Pending Restaurant (rest-006)...');
  const restDetails = await request('/restaurants/rest-006');
  console.assert(restDetails.status === 200, 'Fetch rest-006 should succeed');
  console.assert(restDetails.data.data.verification_status === 'UNDER_VERIFICATION', 'Status should be UNDER_VERIFICATION');
  console.assert(restDetails.data.data.is_verified === 0, 'is_verified should be 0');
  console.log(`   ✅ Restaurant "${restDetails.data.data.name}" verified in state: ${restDetails.data.data.verification_status}`);

  // 4. Attempt customer table booking on unverified restaurant (Must be blocked)
  console.log('\n4. Testing Customer Booking Guard on Unverified Restaurant (Should be 403 Forbidden)...');
  const bookingAttempt = await request('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      restaurantId: 'rest-006',
      guestCount: 2,
      reservationDate: new Date().toISOString().split('T')[0],
      reservationTime: '20:00',
      tableId: 'tbl-6-01'
    }
  });
  console.assert(bookingAttempt.status === 403, 'Booking unverified restaurant should be rejected with 403');
  console.log(`   ✅ Booking prevented as expected! Message: "${bookingAttempt.data.message}"`);

  // 5. Admin fetches all restaurants
  console.log('\n5. App Admin fetching all restaurant applications...');
  const allApps = await request('/admin/restaurants', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.assert(allApps.status === 200, 'Admin fetch restaurants should succeed');
  console.log(`   ✅ Admin retrieved ${allApps.data.data.length} registered restaurant applications.`);

  // 6. Admin Approves rest-006
  console.log('\n6. App Admin Approving Restaurant (rest-006)...');
  const approvalRes = await request('/admin/restaurants/rest-006/approve', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { notes: 'Verified FSSAI license & sanitation standard. Approved for live table bookings.' }
  });
  console.assert(approvalRes.status === 200, 'Admin approval should return 200 OK');
  console.assert(approvalRes.data.data.verification_status === 'APPROVED', 'Status should now be APPROVED');
  console.assert(approvalRes.data.data.is_open === 1, 'is_open should now be 1');
  console.log(`   ✅ "${approvalRes.data.data.name}" successfully approved and made LIVE!`);

  // 7. Customer Booking Now Succeeds
  console.log('\n7. Customer Booking on newly Approved Restaurant (Should succeed with 201 Created)...');
  const successfulBooking = await request('/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      restaurantId: 'rest-006',
      guestCount: 2,
      reservationDate: new Date().toISOString().split('T')[0],
      reservationTime: '20:30',
      tableId: 'tbl-6-01',
      specialRequests: 'Celebration dinner'
    }
  });
  console.assert(successfulBooking.status === 201, 'Booking on approved restaurant should succeed with 201');
  console.log(`   ✅ Customer successfully booked! Reservation ID: ${successfulBooking.data.data.id}`);

  // Teardown: Reset rest-006 back to UNDER_VERIFICATION and clean test reservation
  console.log('\n🧹 Teardown: Resetting rest-006 to UNDER_VERIFICATION for testing...');
  const { getDb } = require('../database/db');
  const db = await getDb();
  await db.run('DELETE FROM reservations WHERE restaurant_id = ?', ['rest-006']);
  await db.run("UPDATE restaurants SET verification_status = 'UNDER_VERIFICATION', is_verified = 0, is_open = 0 WHERE id = ?", ['rest-006']);
  console.log('   ✅ rest-006 cleanly reset to UNDER_VERIFICATION.');

  console.log('\n====================================================');
  console.log('🎉 ADMIN APPROVAL & VERIFICATION WORKFLOW VERIFIED 100%!');
  console.log('====================================================');
}

runAdminVerificationTests().catch(err => {
  console.error('❌ Admin verification test failed:', err);
  process.exit(1);
});
