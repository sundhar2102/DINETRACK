const { getDb } = require('../../database/db');
const { emitTableStatusChanged, emitWaitTimeUpdated } = require('../sockets/socketEmitter');
const { estimateWaitTime } = require('./waitTime.service');
const crypto = require('crypto');

const VALID_TABLE_STATUSES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'BLOCKED', 'MAINTENANCE'];

const ALLOWED_TRANSITIONS = {
  AVAILABLE: ['RESERVED', 'OCCUPIED', 'CLEANING', 'BLOCKED', 'MAINTENANCE'],
  RESERVED: ['OCCUPIED', 'AVAILABLE', 'CLEANING', 'BLOCKED', 'MAINTENANCE'],
  OCCUPIED: ['CLEANING', 'AVAILABLE', 'RESERVED', 'BLOCKED', 'MAINTENANCE'],
  CLEANING: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED', 'MAINTENANCE'],
  BLOCKED: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'],
  MAINTENANCE: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'BLOCKED']
};


const getTablesByRestaurantId = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    'SELECT * FROM tables WHERE restaurant_id = ? ORDER BY table_number ASC',
    [restaurantId]
  );
};

const updateTableStatus = async (tableId, requestedStatus, changedByUserId = null, force = false) => {
  const db = await getDb();

  // Normalize legacy status names if any
  let newStatus = requestedStatus;
  if (newStatus === 'PREPARING') newStatus = 'OCCUPIED';
  if (newStatus === 'OUT_OF_SERVICE') newStatus = 'MAINTENANCE';

  if (!VALID_TABLE_STATUSES.includes(newStatus)) {
    const err = new Error(`Invalid table status '${requestedStatus}'. Supported statuses: ${VALID_TABLE_STATUSES.join(', ')}`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const table = await db.get('SELECT * FROM tables WHERE id = ?', [tableId]);
  if (!table) {
    const err = new Error('Table not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const prevStatus = table.status;

  // Validate state transition unless already at the same status or forced
  if (prevStatus !== newStatus && !force) {
    const allowed = ALLOWED_TRANSITIONS[prevStatus] || [];
    if (!allowed.includes(newStatus)) {
      const err = new Error(`Invalid table transition from '${prevStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'NONE'}`);
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }
  }

  let occupiedSince = table.occupied_since;

  if (newStatus === 'OCCUPIED' && prevStatus !== 'OCCUPIED') {
    occupiedSince = new Date().toISOString();
  } else if (newStatus === 'AVAILABLE' || newStatus === 'CLEANING' || newStatus === 'BLOCKED' || newStatus === 'MAINTENANCE') {
    occupiedSince = null;
  }

  await db.transaction(async (tx) => {
    await tx.run(
      `UPDATE tables SET status = ?, occupied_since = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, occupiedSince, tableId]
    );

    // Record in history
    await tx.run(
      `INSERT INTO table_status_history (id, table_id, previous_status, new_status, changed_by_user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), tableId, prevStatus, newStatus, changedByUserId]
    );
  });

  const updatedTable = await db.get('SELECT * FROM tables WHERE id = ?', [tableId]);

  // Emit real-time Socket.IO update to all connected clients & dashboard
  emitTableStatusChanged(table.restaurant_id, updatedTable);

  // Recalculate and broadcast updated wait time
  try {
    const updatedWaitTime = await estimateWaitTime(table.restaurant_id, 2);
    emitWaitTimeUpdated(table.restaurant_id, updatedWaitTime);
  } catch (e) {
    console.error('Error recalculating wait time on table change:', e);
  }

  return updatedTable;
};

const createTable = async (restaurantId, { table_number, capacity, section = 'Main Dining' }) => {
  const db = await getDb();
  const tableId = crypto.randomUUID();

  await db.run(
    `INSERT INTO tables (id, restaurant_id, table_number, capacity, section, status)
     VALUES (?, ?, ?, ?, ?, 'AVAILABLE')`,
    [tableId, restaurantId, table_number, capacity, section]
  );

  const table = await db.get('SELECT * FROM tables WHERE id = ?', [tableId]);
  emitTableStatusChanged(restaurantId, table);
  return table;
};

const updateTable = async (tableId, { table_number, capacity, section }) => {
  const db = await getDb();
  await db.run(
    `UPDATE tables SET 
      table_number = COALESCE(?, table_number),
      capacity = COALESCE(?, capacity),
      section = COALESCE(?, section),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [table_number, capacity, section, tableId]
  );

  const updated = await db.get('SELECT * FROM tables WHERE id = ?', [tableId]);
  emitTableStatusChanged(updated.restaurant_id, updated);
  return updated;
};

const deleteTable = async (tableId) => {
  const db = await getDb();
  const table = await db.get('SELECT restaurant_id FROM tables WHERE id = ?', [tableId]);
  if (table) {
    await db.run('DELETE FROM tables WHERE id = ?', [tableId]);
    emitTableStatusChanged(table.restaurant_id, { id: tableId, deleted: true });
  }
  return { success: true };
};

module.exports = {
  getTablesByRestaurantId,
  updateTableStatus,
  createTable,
  updateTable,
  deleteTable
};
