const { getDb } = require('../../database/db');
const { emitNotificationCreated } = require('../sockets/socketEmitter');
const crypto = require('crypto');

const createNotification = async ({
  userId,
  title,
  message,
  type = 'GENERAL',
  referenceId = null,
  referenceType = null
}) => {
  const db = await getDb();
  const notifId = crypto.randomUUID();

  await db.run(
    `INSERT INTO notifications (id, user_id, title, message, type, reference_id, reference_type, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [notifId, userId, title, message, type, referenceId, referenceType]
  );

  const notification = await db.get('SELECT * FROM notifications WHERE id = ?', [notifId]);
  emitNotificationCreated(userId, notification);
  return notification;
};

const getUserNotifications = async (userId) => {
  const db = await getDb();
  return db.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
};

const markAsRead = async (notificationId, userId) => {
  const db = await getDb();
  await db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
  return { success: true };
};

const markAllAsRead = async (userId) => {
  const db = await getDb();
  await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  return { success: true };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
