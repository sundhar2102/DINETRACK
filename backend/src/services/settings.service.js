const { getDb } = require('../../database/db');
const crypto = require('crypto');

const getSettings = async (restaurantId) => {
  const db = await getDb();
  let settings = await db.get('SELECT * FROM restaurant_settings WHERE restaurant_id = ?', [restaurantId]);
  if (!settings) {
    // Insert default settings
    const sid = crypto.randomUUID();
    await db.run(
      `INSERT INTO restaurant_settings (id, restaurant_id, auto_accept_reservations, max_advance_days, default_dining_duration_mins, walkin_grace_period_mins, wifi_ssid, wifi_password, tax_percentage, service_charge_percentage, allow_preorders, cancellation_policy)
       VALUES (?, ?, 1, 30, 45, 15, 'SmartTable_Guest_WiFi', 'DineInPass2026', 5.00, 0.00, 1, 'Free cancellation up to 30 minutes before reservation slot.')`,
      [sid, restaurantId]
    );
    settings = await db.get('SELECT * FROM restaurant_settings WHERE restaurant_id = ?', [restaurantId]);
  }
  return settings;
};

const updateSettings = async (restaurantId, data, userId = null) => {
  const db = await getDb();
  await getSettings(restaurantId); // Ensure exists

  await db.run(
    `UPDATE restaurant_settings SET 
      auto_accept_reservations = COALESCE(?, auto_accept_reservations),
      max_advance_days = COALESCE(?, max_advance_days),
      default_dining_duration_mins = COALESCE(?, default_dining_duration_mins),
      walkin_grace_period_mins = COALESCE(?, walkin_grace_period_mins),
      wifi_ssid = COALESCE(?, wifi_ssid),
      wifi_password = COALESCE(?, wifi_password),
      tax_percentage = COALESCE(?, tax_percentage),
      service_charge_percentage = COALESCE(?, service_charge_percentage),
      allow_preorders = COALESCE(?, allow_preorders),
      cancellation_policy = COALESCE(?, cancellation_policy),
      updated_at = CURRENT_TIMESTAMP
     WHERE restaurant_id = ?`,
    [
      data.auto_accept_reservations !== undefined ? (data.auto_accept_reservations ? 1 : 0) : null,
      data.max_advance_days,
      data.default_dining_duration_mins,
      data.walkin_grace_period_mins,
      data.wifi_ssid,
      data.wifi_password,
      data.tax_percentage,
      data.service_charge_percentage,
      data.allow_preorders !== undefined ? (data.allow_preorders ? 1 : 0) : null,
      data.cancellation_policy,
      restaurantId
    ]
  );

  // Log activity
  await db.run(
    'INSERT INTO activity_logs (id, restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)',
    [crypto.randomUUID(), restaurantId, userId, 'SETTINGS_UPDATED', 'Updated operational policies and tax parameters']
  );

  return getSettings(restaurantId);
};

const getActivityLogs = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT a.*, u.name as user_name, u.email as user_email 
     FROM activity_logs a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.restaurant_id = ?
     ORDER BY a.created_at DESC LIMIT 50`,
    [restaurantId]
  );
};

module.exports = {
  getSettings,
  updateSettings,
  getActivityLogs
};
