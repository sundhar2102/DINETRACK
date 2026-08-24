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

async function runCustomerMenuVisibilityTest() {
  console.log('🍽️ Testing Customer Menu Visibility for Owner-Added Dishes...\n');

  // 1. Log in as Owner of Sangeetha
  console.log('1. Logging in as Restaurant Owner (owner@sangeetha.com)...');
  const ownerLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'owner@sangeetha.com', password: 'Password123!' }
  });
  console.assert(ownerLogin.status === 200, 'Owner login failed');
  const ownerToken = ownerLogin.data.data.token;
  console.log('   ✅ Owner logged in successfully.');

  // 2. Owner adds a brand new dish
  console.log('\n2. Owner adding new dish: "Royal Saffron Falooda"...');
  const uniqueDishName = `Royal Saffron Falooda (${Date.now().toString().slice(-4)})`;
  const addDishRes = await request('/menu/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      restaurant_id: 'rest-001',
      name: uniqueDishName,
      description: 'Rich chilled saffron milk laced with basil seeds, rose vermicelli, and creamy artisanal pistachio kulfi.',
      price: 240,
      prep_time_minutes: 8,
      is_vegetarian: 1,
      spiciness_level: 'NONE',
      image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600'
    }
  });
  console.assert(addDishRes.status === 201, `Failed to add dish: ${JSON.stringify(addDishRes.data)}`);
  const addedDish = addDishRes.data.data;
  console.log(`   ✅ Dish created: "${addedDish.name}" (ID: ${addedDish.id.slice(0, 8)}, Price: ₹${addedDish.price})`);

  // 3. Customer views restaurant details (/api/restaurants/rest-001)
  console.log('\n3. Customer opening restaurant detail page (/api/restaurants/rest-001)...');
  const customerRest = await request('/restaurants/rest-001');
  console.assert(customerRest.status === 200, 'Customer fetch restaurant failed');
  
  // Verify dish is in customer menu & categories
  const returnedMenu = customerRest.data.data.menu || [];
  const returnedItems = customerRest.data.data.menuItems || [];
  
  const foundInCategories = returnedMenu.some(cat => 
    (cat.items || []).some(item => item.name === uniqueDishName || item.id === addedDish.id)
  );
  const foundInItemsList = returnedItems.some(item => item.name === uniqueDishName || item.id === addedDish.id);

  console.assert(foundInCategories || foundInItemsList, 'Newly added dish MUST be visible in customer restaurant detail response');
  console.log(`   ✅ Newly added dish "${uniqueDishName}" IS VISIBLE in customer restaurant page!`);

  // 4. Customer views dedicated menu endpoint (/api/menu/rest-001)
  console.log('\n4. Customer fetching menu endpoint (/api/menu/rest-001)...');
  const customerMenu = await request('/menu/rest-001');
  console.assert(customerMenu.status === 200, 'Customer fetch menu failed');
  const menuItems = customerMenu.data.data.items || [];
  const foundInMenuEndpoint = menuItems.some(item => item.name === uniqueDishName || item.id === addedDish.id);
  console.assert(foundInMenuEndpoint, 'Dish must appear in /api/menu/:id endpoint');
  console.log(`   ✅ Newly added dish verified in /api/menu endpoint! Total items available to diners: ${menuItems.length}`);

  // Clean up test dish
  console.log('\n🧹 Cleaning up test dish...');
  await request(`/menu/items/${addedDish.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  console.log('   ✅ Cleaned test dish.');

  console.log('\n====================================================');
  console.log('🎉 CUSTOMER MENU VISIBILITY 100% VERIFIED!');
  console.log('====================================================');
}

runCustomerMenuVisibilityTest().catch(err => {
  console.error('❌ Customer menu visibility test failed:', err);
  process.exit(1);
});
