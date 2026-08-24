const { getDb } = require('../../database/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const getStaffByRestaurant = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT rs.id, rs.restaurant_id, rs.staff_role, rs.is_active, rs.created_at,
            u.id as user_id, u.name, u.email, u.phone, u.avatar_url
     FROM restaurant_staff rs
     JOIN users u ON rs.user_id = u.id
     WHERE rs.restaurant_id = ?
     ORDER BY rs.created_at DESC`,
    [restaurantId]
  );
};

const addStaffMember = async (restaurantId, { name, email, password, phone, staffRole }) => {
  const db = await getDb();
  let user = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);

  let userId;
  if (!user) {
    userId = crypto.randomUUID();
    const hash = await bcrypt.hash(password || 'Password123!', 10);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, phone, role, avatar_url)
       VALUES (?, ?, ?, ?, ?, 'STAFF', ?)`,
      [userId, name, email.toLowerCase().trim(), hash, phone, avatarUrl]
    );
  } else {
    userId = user.id;
  }

  // Check if already on staff
  const existingStaff = await db.get(
    'SELECT id FROM restaurant_staff WHERE restaurant_id = ? AND user_id = ?',
    [restaurantId, userId]
  );
  if (existingStaff) {
    throw new Error('This user is already an assigned staff member for this restaurant.');
  }

  const staffId = crypto.randomUUID();
  await db.run(
    `INSERT INTO restaurant_staff (id, restaurant_id, user_id, staff_role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [staffId, restaurantId, userId, staffRole || 'WAITER']
  );

  return db.get(
    `SELECT rs.*, u.name, u.email, u.phone, u.avatar_url 
     FROM restaurant_staff rs 
     JOIN users u ON rs.user_id = u.id 
     WHERE rs.id = ?`,
    [staffId]
  );
};

const updateStaffRole = async (staffId, { staffRole, is_active }) => {
  const db = await getDb();
  await db.run(
    `UPDATE restaurant_staff SET 
      staff_role = COALESCE(?, staff_role),
      is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [staffRole, is_active, staffId]
  );

  return db.get(
    `SELECT rs.*, u.name, u.email, u.phone, u.avatar_url 
     FROM restaurant_staff rs 
     JOIN users u ON rs.user_id = u.id 
     WHERE rs.id = ?`,
    [staffId]
  );
};

const removeStaffMember = async (staffId) => {
  const db = await getDb();
  await db.run('DELETE FROM restaurant_staff WHERE id = ?', [staffId]);
  return { success: true };
};

module.exports = {
  getStaffByRestaurant,
  addStaffMember,
  updateStaffRole,
  removeStaffMember
};
