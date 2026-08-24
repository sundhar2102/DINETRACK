const { getDb } = require('../../database/db');
const { calculateHaversineDistance, estimateTravelTimeMinutes } = require('../utils/distance');
const { estimateWaitTime } = require('./waitTime.service');
const crypto = require('crypto');

const getNearbyRestaurants = async ({
  lat,
  lng,
  radiusKm = 25,
  cuisine,
  minRating,
  priceRange,
  search,
  maxWaitTime,
  sortBy = 'distance' // 'distance', 'rating', 'waitTime', 'name'
}) => {
  const db = await getDb();

  let query = `
    SELECT 
      r.id, r.owner_id, r.name, r.description, r.cuisine, r.price_range, 
      r.rating, r.rating_count, r.phone, r.email, r.image_url, r.cover_image_url,
      r.is_open, r.verification_status, r.is_verified, r.fssai_license,
      r.opening_time, r.closing_time, r.avg_dining_duration_mins, r.crowd_level,
      loc.address_line1, loc.address_line2, loc.city, loc.state, loc.postal_code,
      loc.latitude, loc.longitude
    FROM restaurants r
    JOIN restaurant_locations loc ON r.id = loc.restaurant_id
    WHERE r.is_open = 1 AND (r.verification_status = 'APPROVED' OR r.verification_status IS NULL)
  `;
  const params = [];


  if (cuisine && cuisine !== 'ALL') {
    query += ` AND r.cuisine LIKE ?`;
    params.push(`%${cuisine}%`);
  }

  if (minRating) {
    query += ` AND r.rating >= ?`;
    params.push(parseFloat(minRating));
  }

  if (priceRange) {
    query += ` AND r.price_range = ?`;
    params.push(priceRange);
  }

  if (search) {
    query += ` AND (r.name LIKE ? OR r.cuisine LIKE ? OR r.description LIKE ? OR loc.city LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const rawRestaurants = await db.query(query, params);

  // Process distance & live stats for each restaurant
  const userLat = lat ? parseFloat(lat) : 13.0604; // Default to Chennai center if not shared
  const userLng = lng ? parseFloat(lng) : 80.2437;

  const processed = [];
  for (const r of rawRestaurants) {
    const distanceKm = calculateHaversineDistance(userLat, userLng, r.latitude, r.longitude);

    if (radiusKm && distanceKm > parseFloat(radiusKm)) {
      continue; // Skip if outside radius
    }

    const travelTime = estimateTravelTimeMinutes(distanceKm);
    const waitInfo = await estimateWaitTime(r.id, 2);

    if (maxWaitTime && waitInfo.estimatedWaitTime > parseInt(maxWaitTime, 10)) {
      continue;
    }

    processed.push({
      ...r,
      distanceKm,
      estimatedTravelTimeMinutes: travelTime,
      availableTablesCount: waitInfo.availableTablesCount,
      totalTablesCount: waitInfo.totalTables,
      estimatedWaitTime: waitInfo.estimatedWaitTime,
      crowdLevel: waitInfo.crowdLevel,
      confidence: waitInfo.confidence,
      location: {
        address1: r.address_line1,
        address2: r.address_line2,
        city: r.city,
        state: r.state,
        postal_code: r.postal_code,
        latitude: r.latitude,
        longitude: r.longitude
      }
    });
  }

  // Sort
  if (sortBy === 'distance') {
    processed.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sortBy === 'rating') {
    processed.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'waitTime') {
    processed.sort((a, b) => a.estimatedWaitTime - b.estimatedWaitTime);
  } else if (sortBy === 'name') {
    processed.sort((a, b) => a.name.localeCompare(b.name));
  }

  return processed;
};

const getRestaurantById = async (id, userLat, userLng) => {
  const db = await getDb();

  const r = await db.get(
    `SELECT 
      r.id, r.owner_id, r.name, r.description, r.cuisine, r.price_range, 
      r.rating, r.rating_count, r.phone, r.email, r.image_url, r.cover_image_url,
      r.is_open, r.verification_status, r.is_verified, r.fssai_license, r.admin_notes,
      r.opening_time, r.closing_time, r.avg_dining_duration_mins, r.crowd_level,
      loc.address_line1, loc.address_line2, loc.city, loc.state, loc.postal_code,
      loc.latitude, loc.longitude
    FROM restaurants r
    JOIN restaurant_locations loc ON r.id = loc.restaurant_id
    WHERE r.id = ?`,
    [id]
  );

  if (!r) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Calculate distance if coordinates provided
  let distanceKm = null;
  let estimatedTravelTime = null;
  if (userLat && userLng) {
    distanceKm = calculateHaversineDistance(parseFloat(userLat), parseFloat(userLng), r.latitude, r.longitude);
    estimatedTravelTime = estimateTravelTimeMinutes(distanceKm);
  }

  // Fetch tables
  const tables = await db.query(
    'SELECT id, table_number, capacity, section, status, occupied_since FROM tables WHERE restaurant_id = ? ORDER BY table_number ASC',
    [id]
  );

  // Fetch Menu categories & active items
  const categories = await db.query(
    'SELECT id, name, description, display_order FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY display_order ASC',
    [id]
  );

  const menuItems = await db.query(
    'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY name ASC',
    [id]
  );

  // Attach items to categories
  let categoriesWithItems = categories.map(cat => ({
    ...cat,
    items: menuItems.filter(item => item.category_id === cat.id)
  }));

  // Include any dishes whose category isn't in menu_categories under Chef Specials
  const categorizedItemIds = new Set(categoriesWithItems.flatMap(c => c.items.map(i => i.id)));
  const uncategorizedItems = menuItems.filter(item => !categorizedItemIds.has(item.id));
  if (uncategorizedItems.length > 0) {
    categoriesWithItems.unshift({
      id: 'cat-chef-specials',
      restaurant_id: id,
      name: 'Chef Specials & New Additions',
      description: 'Special dishes curated by the chef',
      display_order: 0,
      is_active: 1,
      items: uncategorizedItems
    });
  }

  if (categoriesWithItems.length === 0 && menuItems.length > 0) {
    categoriesWithItems = [{
      id: 'cat-all-dishes',
      restaurant_id: id,
      name: 'All Dishes',
      description: 'Complete digital restaurant menu',
      display_order: 1,
      is_active: 1,
      items: menuItems
    }];
  }

  // Fetch Wait time info
  const waitInfo = await estimateWaitTime(id, 2);

  // Fetch Reviews
  const reviews = await db.query(
    'SELECT id, user_id, user_name, rating, comment, created_at FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 20',
    [id]
  );

  return {
    ...r,
    distanceKm,
    estimatedTravelTimeMinutes: estimatedTravelTime,
    location: {
      address1: r.address_line1,
      address2: r.address_line2,
      city: r.city,
      state: r.state,
      postal_code: r.postal_code,
      latitude: r.latitude,
      longitude: r.longitude
    },
    tables,
    menu: categoriesWithItems,
    categories: categoriesWithItems,
    menuCategories: categoriesWithItems,
    menuItems,
    items: menuItems,
    waitInfo,
    reviews
  };
};


const createRestaurant = async (ownerId, data) => {
  const db = await getDb();
  const restId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    // Registered restaurant ALWAYS starts in UNDER_VERIFICATION (is_open: 0, is_verified: 0)
    await tx.run(
      `INSERT INTO restaurants (id, owner_id, name, description, cuisine, price_range, phone, email, image_url, cover_image_url, is_open, verification_status, is_verified, fssai_license, opening_time, closing_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'UNDER_VERIFICATION', 0, ?, ?, ?)`,
      [
        restId,
        ownerId,
        data.name,
        data.description || '',
        data.cuisine || 'Multi-Cuisine',
        data.price_range || '$$',
        data.phone || '',
        data.email || '',
        data.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        data.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        data.fssai_license || 'FSSAI-PENDING',
        data.opening_time || '09:00',
        data.closing_time || '23:00'
      ]
    );

    const locId = crypto.randomUUID();
    const loc = data.location || {};
    await tx.run(
      `INSERT INTO restaurant_locations (id, restaurant_id, address_line1, address_line2, city, state, postal_code, country, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        locId,
        restId,
        loc.address1 || loc.address_line1 || 'Main Street',
        loc.address2 || loc.address_line2 || '',
        loc.city || 'Chennai',
        loc.state || 'Tamil Nadu',
        loc.postal_code || '600001',
        'India',
        loc.latitude || 13.0604,
        loc.longitude || 80.2437
      ]
    );
  });

  return getRestaurantById(restId);
};


const updateRestaurant = async (id, data) => {
  const db = await getDb();
  await db.run(
    `UPDATE restaurants SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      cuisine = COALESCE(?, cuisine),
      price_range = COALESCE(?, price_range),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      image_url = COALESCE(?, image_url),
      cover_image_url = COALESCE(?, cover_image_url),
      is_open = COALESCE(?, is_open),
      opening_time = COALESCE(?, opening_time),
      closing_time = COALESCE(?, closing_time),
      avg_dining_duration_mins = COALESCE(?, avg_dining_duration_mins),
      crowd_level = COALESCE(?, crowd_level),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [data.name, data.description, data.cuisine, data.price_range, data.phone, data.email, data.image_url, data.cover_image_url, data.is_open, data.opening_time, data.closing_time, data.avg_dining_duration_mins, data.crowd_level, id]
  );

  return getRestaurantById(id);
};

module.exports = {
  getNearbyRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant
};
