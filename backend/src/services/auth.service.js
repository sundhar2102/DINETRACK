const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../../database/db');
const env = require('../config/env');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

const register = async ({ name, email, password, phone, role = 'CUSTOMER' }) => {
  const db = await getDb();

  // Check if email already exists
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  await db.run(
    `INSERT INTO users (id, name, email, password_hash, phone, role, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name.trim(), email.toLowerCase().trim(), passwordHash, phone || null, role, avatarUrl]
  );

  const token = generateToken(userId, role);
  return {
    user: {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      role,
      avatar_url: avatarUrl
    },
    token
  };
};

const login = async ({ email, password }) => {
  const db = await getDb();

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.isOperational = true;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.isOperational = true;
    throw error;
  }

  const token = generateToken(user.id, user.role);

  // If user is owner or staff, fetch their assigned restaurant
  let restaurant = null;
  if (user.role === 'OWNER') {
    restaurant = await db.get('SELECT id, name FROM restaurants WHERE owner_id = ? LIMIT 1', [user.id]);
  } else if (user.role === 'STAFF') {
    const staffRec = await db.get(
      'SELECT r.id, r.name, rs.staff_role FROM restaurant_staff rs JOIN restaurants r ON rs.restaurant_id = r.id WHERE rs.user_id = ? LIMIT 1',
      [user.id]
    );
    if (staffRec) {
      restaurant = { id: staffRec.id, name: staffRec.name, staffRole: staffRec.staff_role };
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url,
      restaurant
    },
    token
  };
};

const getMe = async (userId) => {
  const db = await getDb();
  const user = await db.get(
    'SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  let restaurant = null;
  if (user.role === 'OWNER') {
    restaurant = await db.get('SELECT id, name FROM restaurants WHERE owner_id = ? LIMIT 1', [user.id]);
  } else if (user.role === 'STAFF') {
    const staffRec = await db.get(
      'SELECT r.id, r.name, rs.staff_role FROM restaurant_staff rs JOIN restaurants r ON rs.restaurant_id = r.id WHERE rs.user_id = ? LIMIT 1',
      [user.id]
    );
    if (staffRec) {
      restaurant = { id: staffRec.id, name: staffRec.name, staffRole: staffRec.staff_role };
    }
  }

  return {
    ...user,
    restaurant
  };
};

module.exports = {
  register,
  login,
  getMe
};
