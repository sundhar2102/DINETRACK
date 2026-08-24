const { getDb } = require('../../database/db');
const { emitWaitlistUpdated, emitWaitTimeUpdated } = require('../sockets/socketEmitter');
const { createNotification } = require('./notification.service');
const { estimateWaitTime } = require('./waitTime.service');
const crypto = require('crypto');

const joinWaitlist = async ({
  restaurantId,
  userId,
  customerName,
  customerPhone,
  partySize = 2
}) => {
  const db = await getDb();

  // Check if user already in waiting status for this restaurant
  const existing = await db.get(
    `SELECT id FROM waitlist WHERE restaurant_id = ? AND user_id = ? AND status = 'WAITING'`,
    [restaurantId, userId]
  );
  if (existing) {
    const err = new Error('You are already on the waitlist for this restaurant.');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  // Calculate current queue count
  const countRow = await db.get(
    `SELECT COUNT(*) as count FROM waitlist WHERE restaurant_id = ? AND status = 'WAITING'`,
    [restaurantId]
  );
  const position = (countRow ? countRow.count : 0) + 1;

  // Calculate dynamic wait time estimate
  const waitInfo = await estimateWaitTime(restaurantId, partySize);
  const waitId = crypto.randomUUID();

  await db.run(
    `INSERT INTO waitlist (id, restaurant_id, user_id, customer_name, customer_phone, party_size, estimated_wait_minutes, status, queue_position)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING', ?)`,
    [waitId, restaurantId, userId, customerName, customerPhone, partySize, waitInfo.estimatedWaitTime, position]
  );

  const entry = await db.get(
    `SELECT w.*, r.name as restaurant_name FROM waitlist w JOIN restaurants r ON w.restaurant_id = r.id WHERE w.id = ?`,
    [waitId]
  );

  emitWaitlistUpdated(restaurantId, entry);

  // Recalculate wait time for all listeners
  const updatedWait = await estimateWaitTime(restaurantId, partySize);
  emitWaitTimeUpdated(restaurantId, updatedWait);

  await createNotification({
    userId,
    title: 'Added to Waitlist! ⏳',
    message: `You are #${position} in line at ${entry.restaurant_name}. Estimated wait: ${waitInfo.estimatedWaitTime} mins.`,
    type: 'WAITLIST_UPDATE',
    referenceId: waitId,
    referenceType: 'WAITLIST'
  });

  return entry;
};

const getRestaurantWaitlist = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT * FROM waitlist WHERE restaurant_id = ? AND status IN ('WAITING', 'NOTIFIED') ORDER BY queue_position ASC, joined_at ASC`,
    [restaurantId]
  );
};

const updateWaitlistStatus = async (waitlistId, newStatus) => {
  const db = await getDb();
  const entry = await db.get(
    `SELECT w.*, r.name as restaurant_name FROM waitlist w JOIN restaurants r ON w.restaurant_id = r.id WHERE w.id = ?`,
    [waitlistId]
  );
  if (!entry) {
    const err = new Error('Waitlist entry not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  let notifiedAt = entry.notified_at;
  let seatedAt = entry.seated_at;
  if (newStatus === 'NOTIFIED') {
    notifiedAt = new Date().toISOString();
  } else if (newStatus === 'SEATED') {
    seatedAt = new Date().toISOString();
  }

  await db.run(
    `UPDATE waitlist SET status = ?, notified_at = ?, seated_at = ? WHERE id = ?`,
    [newStatus, notifiedAt, seatedAt, waitlistId]
  );

  const updatedEntry = await db.get(
    `SELECT w.*, r.name as restaurant_name FROM waitlist w JOIN restaurants r ON w.restaurant_id = r.id WHERE w.id = ?`,
    [waitlistId]
  );

  emitWaitlistUpdated(entry.restaurant_id, updatedEntry);

  if (newStatus === 'NOTIFIED') {
    await createNotification({
      userId: entry.user_id,
      title: 'Your Table is Ready! 🔔',
      message: `Your party for ${entry.party_size} at ${entry.restaurant_name} is being called! Please proceed to the host desk.`,
      type: 'TABLE_READY',
      referenceId: waitlistId,
      referenceType: 'WAITLIST'
    });
  }

  return updatedEntry;
};

module.exports = {
  joinWaitlist,
  getRestaurantWaitlist,
  updateWaitlistStatus
};
