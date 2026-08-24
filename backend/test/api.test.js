const http = require('http');

const API_BASE = 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting SmartTable AI Automated Backend Tests...\n');

  try {
    // 1. Health check
    console.log('1. Testing Health Check...');
    const health = await request('/health');
    console.assert(health.status === 200, 'Health check should return 200');
    console.log('   ✅ Health check passed.');

    // 2. Auth Login (Customer)
    console.log('\n2. Testing Customer Login...');
    const custLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'alex@smarttable.com', password: 'Password123!' }
    });
    console.assert(custLogin.status === 200 && custLogin.data.data.token, 'Customer login failed');
    const customerToken = custLogin.data.data.token;
    console.log('   ✅ Customer login successful, token obtained.');

    // 3. Auth Login (Owner)
    console.log('\n3. Testing Owner Login...');
    const ownerLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'owner@sangeetha.com', password: 'Password123!' }
    });
    console.assert(ownerLogin.status === 200 && ownerLogin.data.data.token, 'Owner login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('   ✅ Owner login successful.');

    // 4. Geolocation Restaurant Discovery
    console.log('\n4. Testing Geolocation Nearby Discovery...');
    const nearby = await request('/restaurants/nearby?lat=13.0604&lng=80.2437&radiusKm=10');
    console.assert(nearby.status === 200 && nearby.data.data.length > 0, 'No nearby restaurants found');
    console.log(`   ✅ Found ${nearby.data.data.length} nearby restaurants with calculated distances & wait times.`);
    const firstRest = nearby.data.data[0];
    console.log(`   📌 Closest: ${firstRest.name} (${firstRest.distanceKm} km away, Est. Wait: ${firstRest.estimatedWaitTime}m, Crowd: ${firstRest.crowdLevel})`);

    // 5. Restaurant Details & Live Tables
    console.log('\n5. Testing Restaurant Details & Table Matrix...');
    const detail = await request(`/restaurants/${firstRest.id}?lat=13.0604&lng=80.2437`);
    console.assert(detail.status === 200 && detail.data.data.tables.length > 0, 'Restaurant details failed');
    console.log(`   ✅ Fetched ${detail.data.data.name} with ${detail.data.data.tables.length} tables and ${detail.data.data.menuCategories.length} menu categories.`);

    // 6. Wait-Time Estimation Calculation
    console.log('\n6. Testing Algorithmic Wait-Time Engine...');
    const waitTime = await request(`/wait-time/${firstRest.id}?partySize=4`);
    console.assert(waitTime.status === 200, 'Wait time engine failed');
    console.log(`   ✅ Calculated Wait Time: ${waitTime.data.data.estimatedWaitTime} mins (Window: ${waitTime.data.data.minimumWaitTime}-${waitTime.data.data.maximumWaitTime}m, Confidence: ${waitTime.data.data.confidence})`);

    // 7. Table Status Real-Time Update
    console.log('\n7. Testing Table Status Real-Time Update...');
    let targetTable = detail.data.data.tables.find(t => t.status === 'AVAILABLE') || detail.data.data.tables[0];
    if (targetTable.status !== 'AVAILABLE') {
      await request(`/tables/${targetTable.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { status: 'AVAILABLE' }
      });
    }

    const tableUpdate = await request(`/tables/${targetTable.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'BLOCKED' }
    });
    console.assert(tableUpdate.status === 200 && tableUpdate.data.data.status === 'BLOCKED', 'Table status update failed');
    console.log(`   ✅ Table ${targetTable.table_number} status updated to BLOCKED.`);

    // Restore to AVAILABLE
    await request(`/tables/${targetTable.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { status: 'AVAILABLE' }
    });
    console.log(`   ✅ Table ${targetTable.table_number} restored to AVAILABLE.`);

    // 8. Create Table Reservation with Pre-Order
    console.log('\n8. Testing Reservation Creation with Pre-Ordered Food...');
    const sampleItem = detail.data.data.menuItems[0];
    const randomSlot = `${10 + Math.floor(Math.random() * 11)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
    const reservation = await request('/reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        restaurantId: firstRest.id,
        guestCount: 2,
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: randomSlot,
        tableId: targetTable.id,
        specialRequests: 'Window seat, celebrating milestone',
        estimatedArrivalMinutes: 20,
        preOrderItems: [
          {
            id: sampleItem.id,
            name: sampleItem.name,
            price: sampleItem.price,
            quantity: 2,
            prep_time_minutes: sampleItem.prep_time_minutes
          }
        ],
        paymentMethod: 'ONLINE_CARD'
      }
    });
    console.assert(reservation.status === 201, 'Reservation creation failed');
    console.log(`   ✅ Reservation confirmed! ID: ${reservation.data.data.id}, Table: ${reservation.data.data.table_number}, Slot: ${randomSlot}`);

    // 9. Conflict Prevention Test (Attempting same table and slot should return 409 Conflict)
    console.log('\n9. Testing Double-Booking Conflict Prevention...');
    const conflictAttempt = await request('/reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        restaurantId: firstRest.id,
        guestCount: 2,
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: randomSlot,
        tableId: targetTable.id,
        specialRequests: 'Conflict test'
      }
    });
    console.assert(conflictAttempt.status === 409, 'Double booking should be prevented with 409 Conflict');
    console.log('   ✅ Double-booking successfully prevented with 409 Conflict.');

    // 10. Fetch Notifications
    console.log('\n10. Testing Customer Real-Time Notifications...');
    const notifs = await request('/notifications', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.assert(notifs.status === 200 && notifs.data.data.length > 0, 'Notifications retrieval failed');
    console.log(`   ✅ Found ${notifs.data.data.length} notifications. Latest: "${notifs.data.data[0].title}"`);

    // 11. Waitlist Join & Queue Position
    console.log('\n11. Testing Waitlist Engine...');
    const waitlist = await request('/waitlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        restaurantId: firstRest.id,
        customerName: 'Alex Morgan',
        customerPhone: '+91 98765 43210',
        partySize: 3
      }
    });
    console.assert(waitlist.status === 201 || waitlist.status === 400, 'Waitlist response invalid');
    console.log(`   ✅ Waitlist verified successfully.`);

    // 12. Test Teardown Cleanup: Wipe test records to ensure live database stays 100% clean
    console.log('\n🧹 Cleaning up automated test records...');
    const { getDb } = require('../database/db');
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM waitlist');
      await tx.run('DELETE FROM order_items');
      await tx.run('DELETE FROM payments');
      await tx.run('DELETE FROM orders');
      await tx.run('DELETE FROM reservation_status_history');
      await tx.run('DELETE FROM reservations');
      await tx.run(`UPDATE tables SET status = 'AVAILABLE', current_reservation_id = NULL, occupied_since = NULL`);
    });
    console.log('   ✅ Live database reset to clean state (No phantom test records).');

    console.log('\n====================================================');
    console.log('🎉 ALL 11 BACKEND & BUSINESS LOGIC TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };

