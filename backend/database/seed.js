const bcrypt = require('bcryptjs');
const { getDb } = require('./db');
const crypto = require('crypto');

const generateId = () => crypto.randomUUID();

async function seed() {
  console.log('🌱 Starting SmartTable AI database seeding...');
  const db = await getDb();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Clear existing data in reverse dependency order
  const tablesToClear = [
    'marketing_campaigns', 'restaurant_settings', 'support_tickets', 'review_replies',
    'restaurant_events', 'inventory_items', 'offers', 'activity_logs', 'reviews', 
    'restaurant_staff', 'notifications', 'waitlist', 'payments', 'order_items', 
    'orders', 'reservations', 'menu_items', 'menu_categories', 'table_status_history', 
    'tables', 'restaurant_locations', 'restaurants', 'users'
  ];

  for (const table of tablesToClear) {
    try {
      await db.run(`DELETE FROM ${table}`);
    } catch (e) {
      // Table might not exist yet
    }
  }

  // 2. Insert Users
  const adminId1 = 'usr-adm-001';
  const customerId1 = 'usr-cust-001';
  const customerId2 = 'usr-cust-002';
  const ownerId1 = 'usr-own-001';
  const ownerId2 = 'usr-own-002';
  const ownerId3 = 'usr-own-003';
  const ownerId4 = 'usr-own-004';
  const ownerId5 = 'usr-own-005';
  const ownerId6 = 'usr-own-006';
  const chefId1 = 'usr-stf-001';
  const waiterId1 = 'usr-stf-002';

  const users = [
    { id: adminId1, name: 'DineTrack App Admin', email: 'admin@smarttable.com', phone: '+91 99999 88888', role: 'ADMIN', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    { id: customerId1, name: 'Alex Morgan', email: 'alex@smarttable.com', phone: '+91 98765 43210', role: 'CUSTOMER', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: customerId2, name: 'Priya Sharma', email: 'priya@smarttable.com', phone: '+91 98765 43211', role: 'CUSTOMER', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
    { id: ownerId1, name: 'Sangeetha Ramanathan', email: 'owner@sangeetha.com', phone: '+91 98765 43220', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: ownerId2, name: 'Vikram Sethi', email: 'owner@bbqnation.com', phone: '+91 98765 43221', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: ownerId3, name: 'Marco Rossi', email: 'owner@toscano.com', phone: '+91 98765 43222', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { id: ownerId4, name: 'Chef Chen Wei', email: 'owner@mainlandchina.com', phone: '+91 98765 43223', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
    { id: ownerId5, name: 'Captain Rajesh Nair', email: 'owner@coastalcatch.com', phone: '+91 98765 43224', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
    { id: ownerId6, name: 'Farhan Qureshi', email: 'owner@paradise.com', phone: '+91 98765 43225', role: 'OWNER', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
    { id: chefId1, name: 'Chef Suresh Kumar', email: 'chef@sangeetha.com', phone: '+91 98765 43230', role: 'STAFF', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150' },
    { id: waiterId1, name: 'Rahul Verma', email: 'waiter@sangeetha.com', phone: '+91 98765 43231', role: 'STAFF', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' }
  ];



  for (const u of users) {
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, phone, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, passwordHash, u.phone, u.role, u.avatar]
    );
  }

  // 3. Insert Restaurants & Locations
  const rest1Id = 'rest-001';
  const rest2Id = 'rest-002';
  const rest3Id = 'rest-003';
  const rest4Id = 'rest-004';
  const rest5Id = 'rest-005';
  const rest6Id = 'rest-006';


  const restaurants = [
    {
      id: rest1Id,
      owner_id: ownerId1,
      name: 'Sangeetha Veg Gourmet',
      description: 'Authentic South Indian vegetarian delicacies, crispy ghee roasts, traditional thalis, and aromatic filter coffee.',
      cuisine: 'South Indian, Vegetarian',
      price_range: '$$',
      rating: 4.8,
      rating_count: 342,
      phone: '+91 44 2827 1234',
      email: 'contact@sangeethagourmet.com',
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=1200',
      is_open: 1,
      opening_time: '07:00',
      closing_time: '23:00',
      avg_dining_duration_mins: 40,
      crowd_level: 'MEDIUM',
      location: {
        address1: '12 Nungambakkam High Road',
        address2: 'Near Sterling Road Junction',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600034',
        lat: 13.0604,
        lng: 80.2437
      }
    },
    {
      id: rest2Id,
      owner_id: ownerId2,
      name: 'Barbeque Nation Grill & Rooftop',
      description: 'Live over-the-table charcoal grills, Mediterranean skewers, exotic tandoori platters, and lavish dessert buffets.',
      cuisine: 'Barbeque, North Indian, Grills',
      price_range: '$$$',
      rating: 4.6,
      rating_count: 512,
      phone: '+91 44 4210 5678',
      email: 'reservations@bbqnation.com',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
      is_open: 1,
      opening_time: '12:00',
      closing_time: '23:30',
      avg_dining_duration_mins: 65,
      crowd_level: 'HIGH',
      location: {
        address1: '45 Khader Nawaz Khan Road',
        address2: 'Level 4, Skyview Plaza',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600006',
        lat: 13.0645,
        lng: 80.2482
      }
    },
    {
      id: rest3Id,
      owner_id: ownerId3,
      name: 'Toscano Italian Trattoria & Wine Bar',
      description: 'Handcrafted wood-fired Neapolitan pizzas, artisanal pasta ribbons, burrata antipasti, and classic tiramisu.',
      cuisine: 'Italian, Pizza, Continental',
      price_range: '$$$',
      rating: 4.7,
      rating_count: 289,
      phone: '+91 44 2498 7890',
      email: 'ciao@toscano-trattoria.com',
      image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
      is_open: 1,
      opening_time: '11:30',
      closing_time: '23:00',
      avg_dining_duration_mins: 55,
      crowd_level: 'LOW',
      location: {
        address1: '88 Wallace Garden Street',
        address2: 'Opposite Apollo Hospital',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600006',
        lat: 13.0678,
        lng: 80.2520
      }
    },
    {
      id: rest4Id,
      owner_id: ownerId4,
      name: 'Mainland China Imperial House',
      description: 'Dimsums masterfully steamed to perfection, wok-tossed spicy Sichuan prawns, Cantonese noodles, and jasmine tea.',
      cuisine: 'Pan-Asian, Chinese, Dim Sum',
      price_range: '$$$',
      rating: 4.5,
      rating_count: 198,
      phone: '+91 44 2833 4455',
      email: 'dining@mainlandchina.com',
      image_url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
      is_open: 1,
      opening_time: '12:00',
      closing_time: '22:30',
      avg_dining_duration_mins: 50,
      crowd_level: 'MEDIUM',
      location: {
        address1: '102 TTK Road, Alwarpet',
        address2: 'Near Music Academy',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600018',
        lat: 13.0382,
        lng: 80.2564
      }
    },
    {
      id: rest5Id,
      owner_id: ownerId5,
      name: 'The Coastal Catch Seafood Bistro',
      description: 'Fresh catch of the day, Mangalorean fish curry, Goan crab butter garlic, and coastal coconut cocktails.',
      cuisine: 'Seafood, Coastal, Indian',
      price_range: '$$',
      rating: 4.4,
      rating_count: 165,
      phone: '+91 44 2445 9900',
      email: 'hello@coastalcatch.com',
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
      is_open: 1,
      opening_time: '11:00',
      closing_time: '23:00',
      avg_dining_duration_mins: 45,
      crowd_level: 'LOW',
      location: {
        address1: '24 Beach Road, Besant Nagar',
        address2: 'Beside Elliot Promenade',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600090',
        lat: 13.0002,
        lng: 80.2668
      }
    },
    {
      id: rest6Id,
      owner_id: ownerId6,
      name: 'Paradise Biryani & Kebab Hub',
      description: 'Authentic royal Nizami Dum Biryani, Galouti kebabs, and rich double ka meetha.',
      cuisine: 'Hyderabadi, Biryani, Mughlai',
      price_range: '$$',
      rating: 4.6,
      rating_count: 85,
      phone: '+91 44 2811 7788',
      email: 'contact@paradisebiryani.com',
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      cover_image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200',
      is_open: 0,
      verification_status: 'UNDER_VERIFICATION',
      is_verified: 0,
      fssai_license: 'FSSAI-220011993344',
      opening_time: '11:00',
      closing_time: '23:30',
      avg_dining_duration_mins: 45,
      crowd_level: 'LOW',
      location: {
        address1: '56 Cathedral Road, Gopalapuram',
        address2: 'Near Semmozhi Poonga',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600086',
        lat: 13.0489,
        lng: 80.2523
      }
    }
  ];

  for (const r of restaurants) {
    const vStatus = r.verification_status || 'APPROVED';
    const isVer = r.is_verified !== undefined ? r.is_verified : 1;
    const fssai = r.fssai_license || 'FSSAI-998877665544';

    await db.run(
      `INSERT INTO restaurants (id, owner_id, name, description, cuisine, price_range, rating, rating_count, phone, email, image_url, cover_image_url, is_open, verification_status, is_verified, fssai_license, opening_time, closing_time, avg_dining_duration_mins, crowd_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.owner_id, r.name, r.description, r.cuisine, r.price_range, r.rating, r.rating_count, r.phone, r.email, r.image_url, r.cover_image_url, r.is_open, vStatus, isVer, fssai, r.opening_time, r.closing_time, r.avg_dining_duration_mins, r.crowd_level]
    );

    await db.run(
      `INSERT INTO restaurant_locations (id, restaurant_id, address_line1, address_line2, city, state, postal_code, country, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), r.id, r.location.address1, r.location.address2, r.location.city, r.location.state, r.location.postal_code, 'India', r.location.lat, r.location.lng]
    );
  }


  // 4. Staff members
  await db.run(
    `INSERT INTO restaurant_staff (id, restaurant_id, user_id, staff_role) VALUES (?, ?, ?, ?)`,
    [generateId(), rest1Id, chefId1, 'KITCHEN']
  );
  await db.run(
    `INSERT INTO restaurant_staff (id, restaurant_id, user_id, staff_role) VALUES (?, ?, ?, ?)`,
    [generateId(), rest1Id, waiterId1, 'WAITER']
  );

  // 5. Tables for Restaurants
  const tableData1 = [
    { num: 'T-01', cap: 2, sec: 'Main Dining', status: 'AVAILABLE' },
    { num: 'T-02', cap: 2, sec: 'Main Dining', status: 'AVAILABLE' },
    { num: 'T-03', cap: 4, sec: 'Main Dining', status: 'OCCUPIED' },
    { num: 'T-04', cap: 4, sec: 'Main Dining', status: 'RESERVED' },
    { num: 'T-05', cap: 4, sec: 'Window View', status: 'AVAILABLE' },
    { num: 'T-06', cap: 6, sec: 'Family Section', status: 'AVAILABLE' },
    { num: 'T-07', cap: 6, sec: 'Family Section', status: 'OCCUPIED' },
    { num: 'T-08', cap: 8, sec: 'VIP Room', status: 'CLEANING' },
    { num: 'T-09', cap: 2, sec: 'Outdoor Patio', status: 'AVAILABLE' },
    { num: 'T-10', cap: 4, sec: 'Outdoor Patio', status: 'AVAILABLE' }
  ];

  for (const t of tableData1) {
    const tableId = `tbl-sng-${t.num.toLowerCase().replace('-', '')}`;
    await db.run(
      `INSERT INTO tables (id, restaurant_id, table_number, capacity, section, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [tableId, rest1Id, t.num, t.cap, t.sec, t.status]
    );
  }

  // Generate tables for other restaurants
  for (let rIdx = 2; rIdx <= 6; rIdx++) {
    const restId = `rest-00${rIdx}`;
    for (let i = 1; i <= 8; i++) {
      const cap = i <= 3 ? 2 : i <= 6 ? 4 : 6;
      const status = 'AVAILABLE';
      await db.run(
        `INSERT INTO tables (id, restaurant_id, table_number, capacity, section, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [`tbl-${rIdx}-0${i}`, restId, `Table ${i}`, cap, i > 4 ? 'Balcony' : 'Main Hall', status]
      );
    }
  }


  // 6. Menu Categories and Items for Sangeetha Veg Gourmet
  const catStarters = 'cat-001';
  const catMains = 'cat-002';
  const catTiffin = 'cat-003';
  const catBeverages = 'cat-004';
  const catDesserts = 'cat-005';

  const categories = [
    { id: catTiffin, restId: rest1Id, name: 'Signature Tiffin & Dosa', desc: 'Freshly grounded fermented batters & organic wood-pressed ghee', order: 1 },
    { id: catStarters, restId: rest1Id, name: 'Crispy Appetizers', desc: 'Golden crunchy fritters and paneer tandoori specialties', order: 2 },
    { id: catMains, restId: rest1Id, name: 'Royal Curries & Rice', desc: 'Aromatic basmati biryanis, gravies & artisanal breads', order: 3 },
    { id: catBeverages, restId: rest1Id, name: 'Specialty Beverages', desc: 'Kumbakonam degree filter coffee and natural coolers', order: 4 },
    { id: catDesserts, restId: rest1Id, name: 'Traditional Sweets', desc: 'Elachi ghee halwa, gulab jamuns and kulfi', order: 5 }
  ];

  for (const c of categories) {
    await db.run(
      `INSERT INTO menu_categories (id, restaurant_id, name, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [c.id, c.restId, c.name, c.desc, c.order, 1]
    );
  }

  const menuItems = [
    {
      id: 'itm-001', restId: rest1Id, catId: catTiffin, name: 'Ghee Podi Masala Dosa',
      desc: 'Crispy golden crepe smeared with freshly roasted spicy gunpowder and homemade churned butter, served with 3 chutneys and hot sambar.',
      price: 160.00, prepTime: 10, isVeg: 1, isVegan: 0, isGf: 1, spice: 'MEDIUM',
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600'
    },
    {
      id: 'itm-002', restId: rest1Id, catId: catTiffin, name: 'Steamed Mini Ghee Sambar Idli (14 pcs)',
      desc: 'Button idlis floating in aromatic lentil sambar, garnished with pure cow ghee and fresh coriander.',
      price: 130.00, prepTime: 8, isVeg: 1, isVegan: 0, isGf: 1, spice: 'MILD',
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600'
    },
    {
      id: 'itm-003', restId: rest1Id, catId: catTiffin, name: 'Crispy Medu Vada (2 pcs)',
      desc: 'Crispy outer crust, fluffy inside lentil doughnuts laced with crushed black pepper and ginger.',
      price: 90.00, prepTime: 6, isVeg: 1, isVegan: 1, isGf: 1, spice: 'MILD',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600'
    },
    {
      id: 'itm-004', restId: rest1Id, catId: catStarters, name: 'Paneer Tikka Angare',
      desc: 'Cubes of cottage cheese marinated in hung curd, Kashmiri chilies, and smoked over charcoal embers.',
      price: 260.00, prepTime: 18, isVeg: 1, isVegan: 0, isGf: 1, spice: 'SPICY',
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600'
    },
    {
      id: 'itm-005', restId: rest1Id, catId: catStarters, name: 'Crispy Golden Corn Chilli Pepper',
      desc: 'Batter fried sweet corn kernels tossed with scallions, crushed black pepper and sea salt.',
      price: 210.00, prepTime: 12, isVeg: 1, isVegan: 1, isGf: 0, spice: 'MEDIUM',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600'
    },
    {
      id: 'itm-006', restId: rest1Id, catId: catMains, name: 'Dum Handi Veg Biryani',
      desc: 'Fragrant long-grain aged Basmati rice layered with garden vegetables, saffron and mint, slow cooked in a clay pot.',
      price: 290.00, prepTime: 22, isVeg: 1, isVegan: 0, isGf: 1, spice: 'MEDIUM',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600'
    },
    {
      id: 'itm-007', restId: rest1Id, catId: catMains, name: 'Paneer Butter Masala & Butter Naan',
      desc: 'Rich velvety tomato cashew gravy with soft paneer chunks served alongside 2 flaky butter naans.',
      price: 320.00, prepTime: 16, isVeg: 1, isVegan: 0, isGf: 0, spice: 'MILD',
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600'
    },
    {
      id: 'itm-008', restId: rest1Id, catId: catBeverages, name: 'Kumbakonam Degree Filter Coffee',
      desc: 'Authentic South Indian chicory-infused decoction brewed with fresh full-cream milk, frothed to perfection in traditional brass davarah.',
      price: 60.00, prepTime: 5, isVeg: 1, isVegan: 0, isGf: 1, spice: 'NONE',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'
    },
    {
      id: 'itm-009', restId: rest1Id, catId: catBeverages, name: 'Rose Milk Frappé',
      desc: 'Chilled organic rose milk with soaked sabja seeds and dry fruit slivers.',
      price: 95.00, prepTime: 5, isVeg: 1, isVegan: 0, isGf: 1, spice: 'NONE',
      image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600'
    },
    {
      id: 'itm-010', restId: rest1Id, catId: catDesserts, name: 'Hot Sizzling Brownie with Ice Cream',
      desc: 'Decadent chocolate fudge brownie served on a cast-iron sizzler with vanilla bean gelato and warm chocolate ganache.',
      price: 180.00, prepTime: 8, isVeg: 1, isVegan: 0, isGf: 0, spice: 'NONE',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600'
    }
  ];

  for (const item of menuItems) {
    await db.run(
      `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, prep_time_minutes, is_vegetarian, is_vegan, is_gluten_free, is_available, image_url, spiciness_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.restId, item.catId, item.name, item.desc, item.price, item.prepTime, item.isVeg, item.isVegan, item.isGf, 1, item.image, item.spice]
    );
  }

  // Also seed menu items for other restaurants
  for (let rIdx = 2; rIdx <= 6; rIdx++) {
    const restId = `rest-00${rIdx}`;
    const cId = `cat-00${rIdx}-1`;
    await db.run(
      `INSERT INTO menu_categories (id, restaurant_id, name, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [cId, restId, 'Chef Specials', 'Featured house favorites', 1, 1]
    );
    await db.run(
      `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, prep_time_minutes, is_vegetarian, is_vegan, is_gluten_free, is_available, image_url, spiciness_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`itm-0${rIdx}-1`, restId, cId, 'Grand Tasting Platter', 'Assortment of house special appetizers with dips.', 450.00, 20, 0, 0, 0, 1, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 'MEDIUM']
    );
    await db.run(
      `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, prep_time_minutes, is_vegetarian, is_vegan, is_gluten_free, is_available, image_url, spiciness_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`itm-0${rIdx}-2`, restId, cId, 'Artisanal Main Course', 'Signature gourmet entree with side salad.', 380.00, 18, 1, 0, 1, 1, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', 'MILD']
    );
  }

  // 7. Initial Demo Reservations & Orders: DISABLED (Live orders only created when real customer orders manually)
  
  // 8. Demo Waitlist entries: DISABLED (Live queue only populated when real customer joins waitlist)


  // 9. Notifications
  // (Only real live notifications generated dynamically)


  // 10. Reviews & Replies
  const rev1Id = generateId();
  await db.run(
    `INSERT INTO reviews (id, restaurant_id, user_id, user_name, rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rev1Id, rest1Id, customerId1, 'Alex Morgan', 5, 'The food was served within 2 minutes of sitting down because of pre-ordering! Incredible technology and fantastic taste.']
  );
  await db.run(
    `INSERT INTO review_replies (id, review_id, user_id, reply_text)
     VALUES (?, ?, ?, ?)`,
    [generateId(), rev1Id, ownerId1, 'Thank you so much Alex! We strive to make your dining experience as seamless and delicious as possible.']
  );

  await db.run(
    `INSERT INTO reviews (id, restaurant_id, user_id, user_name, rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), rest1Id, customerId2, 'Priya Sharma', 5, 'Real-time wait estimation was spot on! Saved me 30 minutes of standing in line.']
  );

  // 11. Offers & Coupons
  const offers = [
    { id: generateId(), restId: rest1Id, code: 'WELCOME50', desc: '50% off on your first dine-in booking pre-order (up to $15)', type: 'PERCENT', val: 50, min: 20, max: 15 },
    { id: generateId(), restId: rest1Id, code: 'WEEKEND20', desc: 'Flat 20% discount on weekend dinner table pre-orders', type: 'PERCENT', val: 20, min: 30, max: 25 },
    { id: generateId(), restId: rest1Id, code: 'FEAST10', desc: 'Flat $10 Off on group orders above $40', type: 'FLAT', val: 10, min: 40, max: 10 },
    { id: generateId(), restId: rest2Id, code: 'GRILLMASTER', desc: '15% Off all live BBQ grills during weekday lunch', type: 'PERCENT', val: 15, min: 25, max: 20 }
  ];

  for (const off of offers) {
    await db.run(
      `INSERT INTO offers (id, restaurant_id, code, description, discount_type, discount_value, min_order_amount, max_discount, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [off.id, off.restId, off.code, off.desc, off.type, off.val, off.min, off.max]
    );
  }

  // 12. Inventory & Raw Stock
  const inventoryItems = [
    { id: generateId(), restId: rest1Id, name: 'Sona Masoori Rice', cat: 'Grains', qty: 45.0, unit: 'kg', min: 10.0, cost: 2.50, sup: 'Chennai Agro Suppliers', supPhone: '+91 98401 23456' },
    { id: generateId(), restId: rest1Id, name: 'Pure Cow Ghee', cat: 'Dairy', qty: 3.5, unit: 'ltr', min: 5.0, cost: 12.00, sup: 'Nilgiri Dairy Farms', supPhone: '+91 98402 34567' }, // Trigger low stock!
    { id: generateId(), restId: rest1Id, name: 'Urad Dal (Black Gram)', cat: 'Pulses', qty: 28.0, unit: 'kg', min: 8.0, cost: 3.20, sup: 'South Traders Ltd', supPhone: '+91 98403 45678' },
    { id: generateId(), restId: rest1Id, name: 'Fresh Paneer Blocks', cat: 'Dairy', qty: 2.0, unit: 'kg', min: 4.0, cost: 8.50, sup: 'Nilgiri Dairy Farms', supPhone: '+91 98402 34567' }, // Trigger low stock!
    { id: generateId(), restId: rest1Id, name: 'Organic Filter Coffee Beans', cat: 'Beverages', qty: 15.0, unit: 'kg', min: 3.0, cost: 14.00, sup: 'Coorg Estate Direct', supPhone: '+91 98404 56789' },
    { id: generateId(), restId: rest1Id, name: 'Cold Pressed Sesame Oil', cat: 'Oils', qty: 20.0, unit: 'ltr', min: 5.0, cost: 7.50, sup: 'Chettinad Mills', supPhone: '+91 98405 67890' }
  ];

  for (const inv of inventoryItems) {
    await db.run(
      `INSERT INTO inventory_items (id, restaurant_id, item_name, category, quantity, unit, min_threshold, cost_per_unit, supplier_name, supplier_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [inv.id, inv.restId, inv.name, inv.cat, inv.qty, inv.unit, inv.min, inv.cost, inv.sup, inv.supPhone]
    );
  }

  // 13. Restaurant Events
  const events = [
    {
      id: generateId(),
      restId: rest1Id,
      title: 'Carnatic Classical Flute & Fusion Night 🎵',
      description: 'Experience an enchanting evening of live classical flute melodies accompanied by an exclusive 7-course South Indian royal feast.',
      date: '2026-09-05',
      time: '19:30',
      banner: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
      price: 25.00,
      seats: 40,
      booked: 18
    },
    {
      id: generateId(),
      restId: rest1Id,
      title: 'Master Chef Dosai Tasting Masterclass 👨‍🍳',
      description: 'Taste 12 artisanal varieties of dosas paired with rare chutneys and podis handcrafted by our executive chef.',
      date: '2026-09-12',
      time: '18:00',
      banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      price: 18.00,
      seats: 30,
      booked: 24
    }
  ];

  for (const ev of events) {
    await db.run(
      `INSERT INTO restaurant_events (id, restaurant_id, title, description, event_date, event_time, banner_url, ticket_price, total_seats, booked_seats, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [ev.id, ev.restId, ev.title, ev.description, ev.date, ev.time, ev.banner, ev.price, ev.seats, ev.booked]
    );
  }

  // 14. Restaurant Operational Settings
  await db.run(
    `INSERT INTO restaurant_settings (id, restaurant_id, auto_accept_reservations, max_advance_days, default_dining_duration_mins, walkin_grace_period_mins, wifi_ssid, wifi_password, tax_percentage, service_charge_percentage, allow_preorders, cancellation_policy)
     VALUES (?, ?, 1, 30, 45, 15, 'Sangeetha_Guest_5G', 'GourmetDining2026', 5.00, 2.50, 1, 'Free cancellation up to 30 minutes before booking.')`,
    [generateId(), rest1Id]
  );
  await db.run(
    `INSERT INTO restaurant_settings (id, restaurant_id, auto_accept_reservations, max_advance_days, default_dining_duration_mins, walkin_grace_period_mins, wifi_ssid, wifi_password, tax_percentage, service_charge_percentage, allow_preorders, cancellation_policy)
     VALUES (?, ?, 1, 14, 60, 10, 'BBQNation_Guest', 'GrillBuffetPass', 5.00, 5.00, 1, 'Cancellation permitted up to 1 hour before.')`,
    [generateId(), rest2Id]
  );

  // 15. Activity Logs
  await db.run(
    `INSERT INTO activity_logs (id, restaurant_id, user_id, action, details)
     VALUES (?, ?, ?, 'SETTINGS_INITIALIZED', 'Initial restaurant profile & dining parameters configured')`,
    [generateId(), rest1Id, ownerId1]
  );


  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Credentials:');
  console.log('Customer: alex@smarttable.com / Password123!');
  console.log('Customer 2: priya@smarttable.com / Password123!');
  console.log('Owner (Sangeetha): owner@sangeetha.com / Password123!');
  console.log('Owner (BBQ Nation): owner@bbqnation.com / Password123!');
  console.log('Staff (Kitchen): chef@sangeetha.com / Password123!');
  console.log('Staff (Waiter): waiter@sangeetha.com / Password123!');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
