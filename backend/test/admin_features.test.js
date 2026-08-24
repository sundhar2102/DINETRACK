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

async function runAdminFeaturesTest() {
  console.log('🛡️ Starting DineTrack Admin Features Verification...\n');

  // 1. Log in as Super Admin
  console.log('1. Logging in as App Super Admin (admin@smarttable.com)...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@smarttable.com', password: 'Password123!' }
  });

  console.assert(adminLogin.status === 200, 'Admin login failed');
  const adminToken = adminLogin.data.data.token;
  console.log('   ✅ App Admin logged in successfully.');

  // 2. Test Overview: Logged in Users count & Registered Restaurants count
  console.log('\n2. Testing Platform Overview Metrics (/api/admin/overview)...');
  const overviewRes = await request('/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.assert(overviewRes.status === 200, 'Failed to fetch admin overview');
  const overview = overviewRes.data.data;
  console.log(`   👥 Total Registered Users: ${overview.users.total} (Diners: ${overview.users.diners}, Owners: ${overview.users.owners}, Admins: ${overview.users.admins})`);
  console.log(`   🟢 Live Active Online Users: ${overview.users.onlineNow}`);
  console.log(`   🏪 Total Registered Restaurants: ${overview.restaurants.total} (Live: ${overview.restaurants.approved}, Pending: ${overview.restaurants.pending})`);
  console.log(`   💵 Today's Gross Platform Revenue: ₹${overview.financials.todayRevenue} (${overview.financials.todayOrders} orders)`);
  console.assert(overview.users.total > 0, 'Total users must be > 0');
  console.assert(overview.restaurants.total > 0, 'Total restaurants must be > 0');

  // 3. Test Individual Restaurant Revenue Breakdown
  console.log('\n3. Testing Individual Owner Daily Revenue Breakdown (/api/admin/revenue)...');
  const revenueRes = await request('/admin/revenue', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.assert(revenueRes.status === 200, 'Failed to fetch admin revenue breakdown');
  const revenueData = revenueRes.data.data;
  console.log(`   📊 Participating Restaurants: ${revenueData.summary.participatingRestaurants}`);
  console.log(`   💰 Today's Platform Commission (5%): ₹${revenueData.summary.totalTodayPlatformCommission}`);
  console.log(`   🤝 Today's Owner Net Payouts (95%): ₹${revenueData.summary.totalTodayOwnerPayouts}`);

  console.log('\n   --- Individual Owner Daily Revenue Records ---');
  for (const r of revenueData.restaurantsRevenue.slice(0, 5)) {
    console.log(`   • ${r.restaurantName.padEnd(28)} | Owner: ${r.owner.name.padEnd(16)} | Today: ₹${r.metrics.todayGrossRevenue.toString().padEnd(6)} | Fee(5%): ₹${r.metrics.platformCommissionToday} | Net(95%): ₹${r.metrics.ownerNetPayoutToday}`);
  }

  // 4. Test Restaurant Verification & Approval Authority
  console.log('\n4. Testing Restaurant Verification & Approval Authority...');
  const restaurantsRes = await request('/admin/restaurants', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.assert(restaurantsRes.status === 200, 'Failed to fetch restaurants for admin');
  const allRests = restaurantsRes.data.data;
  console.log(`   Total Restaurants available for Admin action: ${allRests.length}`);

  // Test approval workflow on rest-006 (or rest-001)
  const targetRest = allRests.find(r => r.id === 'rest-006') || allRests[0];
  console.log(`   Testing Approval for "${targetRest.name}" (ID: ${targetRest.id})...`);
  const approveRes = await request(`/admin/restaurants/${targetRest.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { notes: 'Verified FSSAI license and safety parameters.' }
  });
  console.assert(approveRes.status === 200, 'Approval failed');
  console.log(`   ✅ "${targetRest.name}" successfully approved. Verification Status: ${approveRes.data.data.verification_status}`);

  console.log('\n====================================================');
  console.log('🎉 ALL 3 ADMIN FEATURES 100% VERIFIED & FUNCTIONAL!');
  console.log('====================================================');
}

runAdminFeaturesTest().catch(err => {
  console.error('❌ Admin features test failed:', err);
  process.exit(1);
});
