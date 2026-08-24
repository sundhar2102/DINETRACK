const { getDb } = require('../../database/db');
const crypto = require('crypto');

const getEventsByRestaurant = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    'SELECT * FROM restaurant_events WHERE restaurant_id = ? ORDER BY event_date ASC, event_time ASC',
    [restaurantId]
  );
};

const getUpcomingPublicEvents = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT * FROM restaurant_events 
     WHERE restaurant_id = ? AND is_active = 1 AND event_date >= CURRENT_DATE
     ORDER BY event_date ASC, event_time ASC`,
    [restaurantId]
  );
};

const createEvent = async (restaurantId, data) => {
  const db = await getDb();
  const eventId = crypto.randomUUID();

  await db.run(
    `INSERT INTO restaurant_events (id, restaurant_id, title, description, event_date, event_time, banner_url, ticket_price, total_seats, booked_seats, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
    [eventId, restaurantId, data.title, data.description || '', data.event_date, data.event_time, data.banner_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', data.ticket_price || 0, data.total_seats || 50]
  );

  return db.get('SELECT * FROM restaurant_events WHERE id = ?', [eventId]);
};

const deleteEvent = async (eventId) => {
  const db = await getDb();
  await db.run('DELETE FROM restaurant_events WHERE id = ?', [eventId]);
  return { success: true };
};

const getAllPublicEvents = async () => {
  const db = await getDb();
  return db.query(
    `SELECT re.*, r.name as restaurant_name, r.image_url as restaurant_image, loc.address_line1 as restaurant_address, r.cuisine as restaurant_cuisine
     FROM restaurant_events re 
     JOIN restaurants r ON re.restaurant_id = r.id 
     LEFT JOIN restaurant_locations loc ON r.id = loc.restaurant_id
     WHERE re.is_active = 1 
     ORDER BY re.event_date ASC, re.event_time ASC`
  );
};


module.exports = {
  getEventsByRestaurant,
  getUpcomingPublicEvents,
  getAllPublicEvents,
  createEvent,
  deleteEvent
};
