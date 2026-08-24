const { getDb } = require('../../database/db');
const crypto = require('crypto');

const getTicketsByRestaurant = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT s.*, u.name as user_name, u.email as user_email 
     FROM support_tickets s
     JOIN users u ON s.user_id = u.id
     WHERE s.restaurant_id = ?
     ORDER BY s.created_at DESC`,
    [restaurantId]
  );
};

const createSupportTicket = async (restaurantId, userId, { subject, category, priority, message }) => {
  const db = await getDb();
  const ticketId = crypto.randomUUID();

  await db.run(
    `INSERT INTO support_tickets (id, restaurant_id, user_id, subject, category, priority, status, message)
     VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)`,
    [ticketId, restaurantId, userId, subject, category || 'GENERAL', priority || 'MEDIUM', message]
  );

  return db.get('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
};

module.exports = {
  getTicketsByRestaurant,
  createSupportTicket
};
