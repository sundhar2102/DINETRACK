const { getDb } = require('../../database/db');

const getRestaurantCustomers = async (restaurantId, { search, filter = 'ALL' } = {}) => {
  const db = await getDb();

  // Aggregate user reservations, total spend, visits count, and last visit
  let query = `
    SELECT 
      u.id as user_id,
      u.name,
      u.email,
      u.phone,
      u.avatar_url,
      COUNT(DISTINCT r.id) as total_reservations,
      COALESCE(SUM(o.total_amount), 0) as lifetime_spend,
      MAX(r.reservation_date) as last_visit_date,
      CASE 
        WHEN COALESCE(SUM(o.total_amount), 0) >= 500 OR COUNT(DISTINCT r.id) >= 5 THEN 'VIP'
        WHEN COUNT(DISTINCT r.id) >= 2 THEN 'REGULAR'
        ELSE 'NEW'
      END as guest_tier
    FROM users u
    JOIN reservations r ON u.id = r.user_id
    LEFT JOIN orders o ON r.id = o.reservation_id AND o.status != 'CANCELLED'
    WHERE r.restaurant_id = ?
  `;
  const params = [restaurantId];

  if (search) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY u.id, u.name, u.email, u.phone, u.avatar_url`;

  if (filter === 'VIP') {
    query += ` HAVING lifetime_spend >= 500 OR total_reservations >= 5`;
  } else if (filter === 'REGULAR') {
    query += ` HAVING total_reservations >= 2`;
  }

  query += ` ORDER BY lifetime_spend DESC, last_visit_date DESC`;

  return db.query(query, params);
};

const getCustomerDetails = async (restaurantId, userId) => {
  const db = await getDb();

  const user = await db.get('SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id = ?', [userId]);
  if (!user) throw new Error('Customer not found');

  const reservations = await db.query(
    `SELECT r.*, t.table_number, o.total_amount as order_total, o.id as order_id, o.status as order_status
     FROM reservations r
     LEFT JOIN tables t ON r.table_id = t.id
     LEFT JOIN orders o ON r.id = o.reservation_id
     WHERE r.restaurant_id = ? AND r.user_id = ?
     ORDER BY r.reservation_date DESC`,
    [restaurantId, userId]
  );

  const reviews = await db.query(
    'SELECT * FROM reviews WHERE restaurant_id = ? AND user_id = ? ORDER BY created_at DESC',
    [restaurantId, userId]
  );

  const favoriteDishes = await db.query(
    `SELECT oi.item_name, SUM(oi.quantity) as order_count 
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.restaurant_id = ? AND o.user_id = ?
     GROUP BY oi.item_name
     ORDER BY order_count DESC LIMIT 5`,
    [restaurantId, userId]
  );

  return {
    customer: user,
    reservations,
    reviews,
    favoriteDishes
  };
};

module.exports = {
  getRestaurantCustomers,
  getCustomerDetails
};
