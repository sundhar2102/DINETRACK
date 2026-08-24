const { getDb } = require('../../database/db');
const crypto = require('crypto');

const getInventoryByRestaurant = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    'SELECT * FROM inventory_items WHERE restaurant_id = ? ORDER BY quantity <= min_threshold DESC, item_name ASC',
    [restaurantId]
  );
};

const getLowStockAlerts = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    'SELECT * FROM inventory_items WHERE restaurant_id = ? AND quantity <= min_threshold ORDER BY quantity ASC',
    [restaurantId]
  );
};

const { emitInventoryLow } = require('../sockets/socketEmitter');

const createInventoryItem = async (restaurantId, data) => {
  const db = await getDb();
  const itemId = crypto.randomUUID();

  await db.run(
    `INSERT INTO inventory_items (id, restaurant_id, item_name, category, quantity, unit, min_threshold, cost_per_unit, supplier_name, supplier_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [itemId, restaurantId, data.item_name, data.category || 'Kitchen', data.quantity || 0, data.unit || 'kg', data.min_threshold || 5, data.cost_per_unit || 0, data.supplier_name || '', data.supplier_phone || '']
  );

  const newItem = await db.get('SELECT * FROM inventory_items WHERE id = ?', [itemId]);
  if (parseFloat(newItem.quantity) <= parseFloat(newItem.min_threshold)) {
    emitInventoryLow(restaurantId, newItem);
  }
  return newItem;
};

const updateStockQuantity = async (itemId, { quantity, action = 'SET' }) => {
  const db = await getDb();
  const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', [itemId]);
  if (!item) throw new Error('Inventory item not found');

  let newQuantity = parseFloat(quantity);
  if (action === 'ADD') {
    newQuantity = parseFloat(item.quantity) + parseFloat(quantity);
  } else if (action === 'DEDUCT') {
    newQuantity = Math.max(0, parseFloat(item.quantity) - parseFloat(quantity));
  }

  await db.run(
    'UPDATE inventory_items SET quantity = ?, last_restocked = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newQuantity, itemId]
  );

  const updated = await db.get('SELECT * FROM inventory_items WHERE id = ?', [itemId]);
  if (parseFloat(updated.quantity) <= parseFloat(updated.min_threshold)) {
    emitInventoryLow(item.restaurant_id, updated);
  }
  return updated;
};

const deleteInventoryItem = async (itemId) => {
  const db = await getDb();
  await db.run('DELETE FROM inventory_items WHERE id = ?', [itemId]);
  return { success: true };
};

module.exports = {
  getInventoryByRestaurant,
  getLowStockAlerts,
  createInventoryItem,
  updateStockQuantity,
  deleteInventoryItem
};
