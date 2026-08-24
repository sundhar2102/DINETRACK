const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getDb } = require('../../database/db');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return errorResponse(res, 'Invalid or expired token. Please log in again.', 401);
    }

    const db = await getDb();
    const user = await db.get(
      'SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return errorResponse(res, 'User account no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 500);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const db = await getDb();
        const user = await db.get(
          'SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?',
          [decoded.userId]
        );
        if (user) {
          req.user = user;
        }
      } catch (e) {
        // Token invalid, continue as guest
      }
    }
    next();
  } catch (e) {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
