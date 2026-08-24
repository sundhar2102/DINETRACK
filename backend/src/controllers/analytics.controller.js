const { getDb } = require('../../database/db');
const { successResponse } = require('../utils/response');

const getRestaurantAnalytics = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const db = await getDb();

    // 1. Total revenue today
    const revenueRow = await db.get(
      `SELECT COALESCE(SUM(total_amount), 0) as today_revenue, COUNT(*) as today_orders 
       FROM orders 
       WHERE restaurant_id = ? AND status != 'CANCELLED' AND DATE(created_at) = CURRENT_DATE`,
      [restaurantId]
    );

    // 2. Active reservations today
    const resCount = await db.get(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE restaurant_id = ? AND status IN ('CONFIRMED', 'SEATED') AND reservation_date = CURRENT_DATE`,
      [restaurantId]
    );

    // 3. Table stats
    const tables = await db.query('SELECT status, capacity FROM tables WHERE restaurant_id = ?', [restaurantId]);
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
    const availableTables = tables.filter(t => t.status === 'AVAILABLE').length;
    const reservedTables = tables.filter(t => t.status === 'RESERVED').length;
    const cleaningTables = tables.filter(t => t.status === 'CLEANING').length;

    // 4. Waitlist count
    const waitlistCount = await db.get(
      `SELECT COUNT(*) as count FROM waitlist WHERE restaurant_id = ? AND status = 'WAITING'`,
      [restaurantId]
    );

    // 5. Popular menu items
    const topItems = await db.query(
      `SELECT oi.item_name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.restaurant_id = ? AND o.status != 'CANCELLED'
       GROUP BY oi.item_name
       ORDER BY total_sold DESC LIMIT 5`,
      [restaurantId]
    );

    return successResponse(res, {
      todayRevenue: revenueRow ? revenueRow.today_revenue : 0,
      todayOrders: revenueRow ? revenueRow.today_orders : 0,
      activeReservations: resCount ? resCount.count : 0,
      totalTables,
      occupiedTables,
      availableTables,
      reservedTables,
      cleaningTables,
      waitlistQueue: waitlistCount ? waitlistCount.count : 0,
      occupancyPercentage: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
      topItems
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurantAnalytics
};
