const { getDb } = require('../../database/db');
const { successResponse, errorResponse } = require('../utils/response');
const { createNotification } = require('../services/notification.service');
const { emitToRoom } = require('../sockets/socketEmitter');
const { getOnlineStats } = require('../sockets/socketHandler');

/**
 * 1. Platform Overview Stats: Logged In Users, Registered Users, Restaurants & Revenue
 */
const getAdminOverview = async (req, res, next) => {
  try {
    const db = await getDb();
    const onlineStats = getOnlineStats();
    const today = new Date().toISOString().slice(0, 10);

    // Users breakdown
    const usersCountRow = await db.get(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'CUSTOMER' THEN 1 ELSE 0 END) as diners_count,
        SUM(CASE WHEN role IN ('RESTAURANT_OWNER', 'STAFF') THEN 1 ELSE 0 END) as owners_count,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admins_count
      FROM users
    `);

    // Restaurants breakdown
    const restCountRow = await db.get(`
      SELECT 
        COUNT(*) as total_restaurants,
        SUM(CASE WHEN verification_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN verification_status = 'UNDER_VERIFICATION' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN verification_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count
      FROM restaurants
    `);

    // Financial Overview (Today vs All-Time)
    const ordersStatsRow = await db.get(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_gross_revenue,
        SUM(CASE WHEN DATE(created_at) = DATE(?) THEN 1 ELSE 0 END) as today_orders,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE(?) THEN total_amount ELSE 0 END), 0) as today_gross_revenue
      FROM orders
    `, [today, today]);

    // Reservations count
    const resCountRow = await db.get(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN DATE(reservation_date) = DATE(?) THEN 1 ELSE 0 END) as today_reservations
      FROM reservations
    `, [today]);

    // Recent Users with online flag
    const recentUsers = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
             (SELECT COUNT(*) FROM reservations WHERE user_id = u.id) as reservation_count,
             (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 12
    `);

    const usersWithOnline = recentUsers.map(u => ({
      ...u,
      is_online: onlineStats.onlineUserIds.includes(u.id)
    }));

    return successResponse(res, {
      users: {
        total: Number(usersCountRow?.total_users || 0),
        diners: Number(usersCountRow?.diners_count || 0),
        owners: Number(usersCountRow?.owners_count || 0),
        admins: Number(usersCountRow?.admins_count || 0),
        onlineNow: Math.max(onlineStats.uniqueOnlineUsers, 1), // Minimum 1 for active admin session
        onlineSockets: Math.max(onlineStats.totalSockets, 1)
      },
      restaurants: {
        total: Number(restCountRow?.total_restaurants || 0),
        approved: Number(restCountRow?.approved_count || 0),
        pending: Number(restCountRow?.pending_count || 0),
        rejected: Number(restCountRow?.rejected_count || 0)
      },
      financials: {
        todayOrders: Number(ordersStatsRow?.today_orders || 0),
        todayRevenue: Number(ordersStatsRow?.today_gross_revenue || 0),
        totalOrders: Number(ordersStatsRow?.total_orders || 0),
        totalRevenue: Number(ordersStatsRow?.total_gross_revenue || 0),
        todayReservations: Number(resCountRow?.today_reservations || 0),
        totalReservations: Number(resCountRow?.total_reservations || 0)
      },
      recentUsers: usersWithOnline
    }, 'Admin overview metrics fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Revenue Breakdown per Restaurant Owner Individually (Daily, Weekly, All-Time)
 */
const getAdminRevenueBreakdown = async (req, res, next) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);

    // Query all restaurants with their respective owners and revenue calculations
    const rows = await db.query(`
      SELECT 
        r.id as restaurant_id,
        r.name as restaurant_name,
        r.cuisine,
        r.image_url as restaurant_image,
        r.verification_status,
        r.is_open,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        loc.city,
        loc.state,
        
        -- Today's Order Statistics
        COALESCE((
          SELECT COUNT(*) 
          FROM orders 
          WHERE restaurant_id = r.id AND DATE(created_at) = DATE(?)
        ), 0) as today_orders_count,
        
        COALESCE((
          SELECT SUM(total_amount) 
          FROM orders 
          WHERE restaurant_id = r.id AND DATE(created_at) = DATE(?)
        ), 0) as today_gross_revenue,

        COALESCE((
          SELECT SUM(total_amount) 
          FROM orders 
          WHERE restaurant_id = r.id AND DATE(created_at) = DATE(?) AND status IN ('SERVED', 'COMPLETED', 'CONFIRMED', 'COOKING')
        ), 0) as today_confirmed_revenue,

        -- All Time Statistics
        COALESCE((
          SELECT COUNT(*) 
          FROM orders 
          WHERE restaurant_id = r.id
        ), 0) as all_time_orders_count,

        COALESCE((
          SELECT SUM(total_amount) 
          FROM orders 
          WHERE restaurant_id = r.id
        ), 0) as all_time_gross_revenue,

        -- Reservations
        COALESCE((
          SELECT COUNT(*) 
          FROM reservations 
          WHERE restaurant_id = r.id AND DATE(reservation_date) = DATE(?)
        ), 0) as today_reservations_count,

        COALESCE((
          SELECT COUNT(*) 
          FROM reservations 
          WHERE restaurant_id = r.id
        ), 0) as all_time_reservations_count

      FROM restaurants r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN restaurant_locations loc ON r.id = loc.restaurant_id
      ORDER BY today_gross_revenue DESC, all_time_gross_revenue DESC, r.name ASC
    `, [today, today, today, today]);

    // Format results with 5% platform fee and 95% net payout
    const platformFeePercent = 5.0;

    const breakdown = rows.map(item => {
      const todayGross = Number(item.today_gross_revenue || 0);
      const allTimeGross = Number(item.all_time_gross_revenue || 0);
      const todayOrders = Number(item.today_orders_count || 0);
      const allTimeOrders = Number(item.all_time_orders_count || 0);

      const platformCommissionToday = Number((todayGross * (platformFeePercent / 100)).toFixed(2));
      const ownerNetPayoutToday = Number((todayGross - platformCommissionToday).toFixed(2));
      
      const platformCommissionAllTime = Number((allTimeGross * (platformFeePercent / 100)).toFixed(2));
      const ownerNetPayoutAllTime = Number((allTimeGross - platformCommissionAllTime).toFixed(2));

      const avgOrderValue = todayOrders > 0 
        ? Number((todayGross / todayOrders).toFixed(0))
        : (allTimeOrders > 0 ? Number((allTimeGross / allTimeOrders).toFixed(0)) : 0);

      return {
        restaurantId: item.restaurant_id,
        restaurantName: item.restaurant_name,
        cuisine: item.cuisine,
        image: item.restaurant_image,
        city: item.city || 'Chennai',
        verificationStatus: item.verification_status,
        isOpen: item.is_open === 1,
        owner: {
          id: item.owner_id,
          name: item.owner_name,
          email: item.owner_email,
          phone: item.owner_phone
        },
        metrics: {
          todayOrders,
          todayGrossRevenue: todayGross,
          todayConfirmedRevenue: Number(item.today_confirmed_revenue || 0),
          todayReservations: Number(item.today_reservations_count || 0),
          platformCommissionToday,
          ownerNetPayoutToday,
          allTimeOrders,
          allTimeGrossRevenue: allTimeGross,
          allTimeReservations: Number(item.all_time_reservations_count || 0),
          platformCommissionAllTime,
          ownerNetPayoutAllTime,
          averageOrderValue: avgOrderValue
        }
      };
    });

    const totalTodayPlatformRevenue = breakdown.reduce((sum, r) => sum + r.metrics.todayGrossRevenue, 0);
    const totalAllTimePlatformRevenue = breakdown.reduce((sum, r) => sum + r.metrics.allTimeGrossRevenue, 0);
    const totalTodayOrders = breakdown.reduce((sum, r) => sum + r.metrics.todayOrders, 0);

    return successResponse(res, {
      date: today,
      summary: {
        totalTodayPlatformRevenue,
        totalTodayPlatformCommission: Number((totalTodayPlatformRevenue * 0.05).toFixed(2)),
        totalTodayOwnerPayouts: Number((totalTodayPlatformRevenue * 0.95).toFixed(2)),
        totalTodayOrders,
        totalAllTimePlatformRevenue,
        totalAllTimePlatformCommission: Number((totalAllTimePlatformRevenue * 0.05).toFixed(2)),
        participatingRestaurants: breakdown.length
      },
      restaurantsRevenue: breakdown
    }, 'Individual restaurant revenue breakdown retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Registered Users Directory (With Online Indicators)
 */
const getAdminUsers = async (req, res, next) => {
  try {
    const db = await getDb();
    const { role } = req.query;
    const onlineStats = getOnlineStats();

    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.created_at,
             (SELECT COUNT(*) FROM reservations WHERE user_id = u.id) as reservation_count,
             (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
             COALESCE((SELECT SUM(total_amount) FROM orders WHERE user_id = u.id), 0) as total_spent,
             r.name as owned_restaurant_name,
             r.id as owned_restaurant_id
      FROM users u
      LEFT JOIN restaurants r ON r.owner_id = u.id
    `;
    const params = [];

    if (role && role !== 'ALL') {
      sql += ` WHERE u.role = ?`;
      params.push(role);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const users = await db.query(sql, params);

    const formattedUsers = users.map(u => ({
      ...u,
      is_online: onlineStats.onlineUserIds.includes(u.id) || u.role === 'ADMIN' // Active session
    }));

    return successResponse(res, formattedUsers, 'Admin users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Get all restaurants with full verification and owner metadata
 */
const getAllRestaurants = async (req, res, next) => {
  try {
    const db = await getDb();
    const { status } = req.query;

    let sql = `
      SELECT r.*, 
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             loc.address_line1, loc.city, loc.state, loc.postal_code,
             (SELECT COUNT(*) FROM tables WHERE restaurant_id = r.id) as table_count,
             (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = r.id) as menu_item_count,
             COALESCE((SELECT SUM(total_amount) FROM orders WHERE restaurant_id = r.id), 0) as total_revenue
      FROM restaurants r
      JOIN users u ON r.owner_id = u.id
      LEFT JOIN restaurant_locations loc ON r.id = loc.restaurant_id
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ` WHERE r.verification_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY CASE WHEN r.verification_status = 'UNDER_VERIFICATION' THEN 0 ELSE 1 END, r.created_at DESC`;

    const restaurants = await db.query(sql, params);
    return successResponse(res, restaurants, 'Admin restaurants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Approve a restaurant application
 */
const approveRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes = 'Approved by App Admin after license & safety verification' } = req.body;
    const db = await getDb();

    const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (!restaurant) {
      const err = new Error('Restaurant not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    await db.run(
      `UPDATE restaurants 
       SET verification_status = 'APPROVED', is_verified = 1, is_open = 1, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [notes, id]
    );

    const updatedRest = await db.get('SELECT * FROM restaurants WHERE id = ?', [id]);

    // Emit live WebSocket events
    emitToRoom(`restaurant:${id}`, 'restaurant_approved', updatedRest);
    emitToRoom('all_customers', 'restaurant_updated', updatedRest);

    // Notify Restaurant Owner
    if (restaurant.owner_id) {
      await createNotification({
        userId: restaurant.owner_id,
        title: '🎉 Restaurant Approved & LIVE!',
        message: `Congratulations! ${restaurant.name} has been verified and approved by DineTrack App Admin. You now have full access to manage your menu and accept customer table bookings.`,
        type: 'SYSTEM',
        referenceId: id,
        referenceType: 'RESTAURANT'
      });
    }

    return successResponse(res, updatedRest, `Restaurant ${restaurant.name} has been approved and is now LIVE!`);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Reject a restaurant application
 */
const rejectRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Information incomplete or FSSAI license verification pending' } = req.body;
    const db = await getDb();

    const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (!restaurant) {
      const err = new Error('Restaurant not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    await db.run(
      `UPDATE restaurants 
       SET verification_status = 'REJECTED', is_verified = 0, is_open = 0, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [reason, id]
    );

    const updatedRest = await db.get('SELECT * FROM restaurants WHERE id = ?', [id]);

    // Notify Restaurant Owner
    if (restaurant.owner_id) {
      await createNotification({
        userId: restaurant.owner_id,
        title: '⚠️ Application Under Review / Action Required',
        message: `Your restaurant application for ${restaurant.name} was not approved: ${reason}. Please update your business details or contact support.`,
        type: 'SYSTEM',
        referenceId: id,
        referenceType: 'RESTAURANT'
      });
    }

    return successResponse(res, updatedRest, `Restaurant ${restaurant.name} application marked as REJECTED.`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminOverview,
  getAdminRevenueBreakdown,
  getAdminUsers,
  getAllRestaurants,
  approveRestaurant,
  rejectRestaurant
};
