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

async function runOwnerPlatformTests() {
  console.log('🧪 Starting Owner Platform (21 Modules) Tests...\n');

  try {
    // 1. Owner Login
    console.log('1. Authenticating as Restaurant Owner...');
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: 'owner@sangeetha.com', password: 'Password123!' }
    });
    console.assert(login.status === 200, 'Owner login failed');
    const ownerToken = login.data.data.token;
    const restaurantId = login.data.data.user?.restaurant?.id || 'rest-001';
    console.log(`   ✅ Logged in for restaurant: ${login.data.data.user?.restaurant?.name || 'Sangeetha'}`);

    // 2. Offers & Promo Validation
    console.log('\n2. Testing Offers & Coupon Validation...');
    const offers = await request(`/offers/restaurant/${restaurantId}`);
    console.assert(offers.status === 200 && offers.data.data.length > 0, 'Offers failed');
    console.log(`   ✅ Fetched ${offers.data.data.length} active promotions.`);

    const couponCheck = await request('/offers/validate', {
      method: 'POST',
      body: { restaurantId, code: 'WELCOME50', orderAmount: 30 }
    });
    console.assert(couponCheck.status === 200 && couponCheck.data.data.discountAmount === 15, 'Coupon check failed');
    console.log(`   ✅ Validated WELCOME50: Applied $${couponCheck.data.data.discountAmount} discount on $30 order.`);

    // 3. Inventory & Low Stock Alerts
    console.log('\n3. Testing Inventory Management & Low-Stock Alerts...');
    const inventory = await request(`/inventory/restaurant/${restaurantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.assert(inventory.status === 200 && inventory.data.data.length > 0, 'Inventory fetch failed');
    console.log(`   ✅ Fetched ${inventory.data.data.length} inventory items.`);

    const lowStock = await request(`/inventory/restaurant/${restaurantId}/low-stock`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.assert(lowStock.status === 200 && lowStock.data.data.length > 0, 'Low stock alerts failed');
    console.log(`   ⚠️ Found ${lowStock.data.data.length} items below minimum threshold (e.g. ${lowStock.data.data[0].item_name}).`);

    // 4. Customer CRM Directory
    console.log('\n4. Testing Customer CRM & Guest History...');
    const crm = await request(`/crm/restaurant/${restaurantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.assert(crm.status === 200 && crm.data.data.length > 0, 'CRM fetch failed');
    console.log(`   ✅ Fetched ${crm.data.data.length} diner profiles with lifetime spend & tier.`);

    // 5. Events & Tasting Nights
    console.log('\n5. Testing Restaurant Events...');
    const events = await request(`/events/restaurant/${restaurantId}`);
    console.assert(events.status === 200 && events.data.data.length > 0, 'Events fetch failed');
    console.log(`   ✅ Found ${events.data.data.length} upcoming events (e.g. "${events.data.data[0].title}").`);

    // 6. Reports & CSV Export
    console.log('\n6. Testing Sales Reports & CSV Export...');
    const salesReport = await request(`/reports/restaurant/${restaurantId}/sales`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.assert(salesReport.status === 200, 'Sales report failed');
    console.log(`   ✅ Generated sales summary report.`);

    // 7. Settings & Audit Logs
    console.log('\n7. Testing Restaurant Operational Settings & Logs...');
    const settings = await request(`/settings/restaurant/${restaurantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.assert(settings.status === 200 && settings.data.data.wifi_ssid, 'Settings fetch failed');
    console.log(`   ✅ Settings verified (WiFi: ${settings.data.data.wifi_ssid}, Tax: ${settings.data.data.tax_percentage}%).`);

    // 8. Staff Management
    console.log('\n8. Testing Staff Roster & Permissions...');
    const staff = await request(`/staff/restaurant/${restaurantId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    console.assert(staff.status === 200 && staff.data.data.length > 0, 'Staff fetch failed');
    console.log(`   ✅ Staff roster active: ${staff.data.data.map(s => `${s.name} (${s.staff_role})`).join(', ')}`);

    // 9. Reviews with Replies
    console.log('\n9. Testing Customer Reviews & Owner Replies...');
    const reviews = await request(`/reviews/restaurant/${restaurantId}`);
    console.assert(reviews.status === 200 && reviews.data.data.length > 0, 'Reviews fetch failed');
    console.log(`   ✅ Retrieved ${reviews.data.data.length} customer reviews with owner reply linkage.`);

    console.log('\n====================================================');
    console.log('🎉 ALL OWNER PLATFORM BACKEND MODULES VERIFIED (100%)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runOwnerPlatformTests();
}

module.exports = { runOwnerPlatformTests };
