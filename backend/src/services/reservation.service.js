const crypto = require('crypto');
const { getDb } = require('../../database/db');
const { calculateEstimatedWaitTime } = require('./waitTime.service');
const { emitToRoom, emitTableStatusChanged, emitReservationCreated, emitReservationUpdated, emitOrderStatusChanged } = require('../sockets/socketEmitter');
const { createNotification } = require('./notification.service');



const createReservation = async (data, explicitUserId = null) => {
  const db = await getDb();
  const reservationId = crypto.randomUUID();

  const restaurantId = data.restaurant_id || data.restaurantId;
  const userId = data.user_id || data.userId || explicitUserId;
  const tableId = data.table_id || data.tableId || null;
  const guestCount = parseInt(data.guest_count || data.guestCount || 2, 10);
  const reservationDate = data.reservation_date || data.reservationDate;
  const reservationTime = data.reservation_time || data.reservationTime;
  const specialRequests = data.special_requests || data.specialRequests || '';
  const preOrderItems = data.items || data.preOrderItems || data.pre_order_items || [];
  const guestName = data.guest_name || data.guestName || 'Guest Diner';
  const guestPhone = data.guest_phone || data.guestPhone || '';
  const guestEmail = data.guest_email || data.guestEmail || '';

  // Validate restaurant existence and admin approval
  const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
  if (!restaurant) {
    const err = new Error('Restaurant not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (restaurant.verification_status && restaurant.verification_status !== 'APPROVED') {
    const err = new Error('This restaurant is currently under admin verification. Online table bookings are temporarily closed until verified.');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }

  // Conflict Check: Double-booking prevention
  if (tableId) {
    const existingBooking = await db.get(
      `SELECT * FROM reservations
       WHERE table_id = ?
         AND reservation_date = ?
         AND reservation_time = ?
         AND status IN ('CONFIRMED', 'PENDING', 'SEATED')`,
      [tableId, reservationDate, reservationTime]
    );

    if (existingBooking) {
      const err = new Error(`Table is already booked for ${reservationDate} at ${reservationTime}. Please select another time slot or table.`);
      err.statusCode = 409;
      err.isOperational = true;
      throw err;
    }
  }

  // 1. Create the reservation record first (Satisfies Foreign Key for orders)
  await db.run(
    `INSERT INTO reservations 
      (id, restaurant_id, user_id, table_id, guest_count, reservation_date, reservation_time, status, special_requests, estimated_arrival_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    [
      reservationId,
      restaurantId,
      userId,
      tableId,
      guestCount,
      reservationDate,
      reservationTime,
      specialRequests,
      15
    ]
  );

  // 2. Handle attached food pre-order if items provided
  let orderId = null;
  let orderTotal = 0;

  if (preOrderItems && preOrderItems.length > 0) {
    orderId = crypto.randomUUID();
    const subtotal = preOrderItems.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
    const tax = subtotal * 0.05;
    orderTotal = subtotal + tax;

    await db.transaction(async (tx) => {
      // Order starts in PENDING status (Awaiting owner confirmation)
      await tx.run(
        `INSERT INTO orders (id, reservation_id, restaurant_id, user_id, table_id, status, total_amount, subtotal, tax)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
        [orderId, reservationId, restaurantId, userId, tableId, orderTotal, subtotal, tax]
      );

      for (const item of preOrderItems) {
        let menuItemId = item.menu_item_id || item.id;
        // Verify menuItemId exists in database
        let exists = await tx.get('SELECT id FROM menu_items WHERE id = ?', [menuItemId]);
        if (!exists) {
          const fallback = await tx.get('SELECT id FROM menu_items WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
          if (fallback) {
            menuItemId = fallback.id;
          } else {
            // Create item on the fly if needed
            const newId = crypto.randomUUID();
            let cat = await tx.get('SELECT id FROM menu_categories WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
            let catId = cat ? cat.id : crypto.randomUUID();
            if (!cat) {
              await tx.run(
                `INSERT INTO menu_categories (id, restaurant_id, name, description, display_order, is_active) VALUES (?, ?, 'Chef Specials', 'House specialties', 1, 1)`,
                [catId, restaurantId]
              );
            }
            await tx.run(
              `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, prep_time_minutes, is_vegetarian, is_available)
               VALUES (?, ?, ?, ?, 'Pre-order dish', ?, 15, 1, 1)`,
              [newId, restaurantId, catId, item.name || 'Chef Special', item.price || 150]
            );
            menuItemId = newId;
          }
        }

        await tx.run(
          `INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, total_price, customization_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            orderId,
            menuItemId,
            item.name || item.item_name || 'Chef Special Item',
            item.quantity || 1,
            item.price,
            item.price * (item.quantity || 1),
            item.special_instructions || item.specialInstructions || item.customization_notes || ''
          ]
        );
      }
    });
  }


  const reservation = await db.get(
    `SELECT r.*, t.table_number, t.capacity as table_capacity, rest.name as restaurant_name,
            o.id as order_id, o.total_amount as order_total
     FROM reservations r
     LEFT JOIN tables t ON r.table_id = t.id
     JOIN restaurants rest ON r.restaurant_id = rest.id
     LEFT JOIN orders o ON o.reservation_id = r.id
     WHERE r.id = ?`,
    [reservationId]
  );


  // Emit WebSocket event to restaurant room (Owner will see Pending booking)
  emitToRoom(restaurantId, 'reservation_created', reservation);


  // Create persistent notification for user
  if (userId) {
    await createNotification({
      userId,
      title: 'Table Reservation Received! ⏳',
      message: `Your booking at ${restaurant.name} for ${reservationDate} at ${reservationTime} (${guestCount} guests) has been submitted and is awaiting owner approval.`,
      type: 'RESERVATION',
      referenceId: reservationId,
      referenceType: 'RESERVATION'
    }).catch(e => console.error('Notification error:', e));
  }


  return reservation;
};

const getReservationById = async (id) => {
  const db = await getDb();
  const res = await db.get(
    `SELECT r.*, t.table_number, t.section, rest.name as restaurant_name, loc.address_line1 as restaurant_address, loc.city as restaurant_city, rest.image_url as restaurant_image_url
     FROM reservations r
     LEFT JOIN tables t ON r.table_id = t.id
     JOIN restaurants rest ON r.restaurant_id = rest.id
     LEFT JOIN restaurant_locations loc ON rest.id = loc.restaurant_id
     WHERE r.id = ?`,
    [id]
  );

  if (!res) {
    const err = new Error('Reservation not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Find linked order for this reservation
  const order = await db.get(
    'SELECT * FROM orders WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1',
    [id]
  );

  let items = [];
  let payment = null;

  if (order) {
    items = await db.query(
      `SELECT oi.*, 
              COALESCE(oi.unit_price, mi.price, 0) as price, 
              COALESCE(oi.unit_price, mi.price, 0) as unit_price, 
              COALESCE(oi.total_price, (oi.unit_price * oi.quantity), (mi.price * oi.quantity), 0) as total_price,
              COALESCE(oi.item_name, mi.name, 'Chef Special Dish') as name,
              COALESCE(oi.item_name, mi.name, 'Chef Special Dish') as item_name,
              mi.image_url as item_image,
              mi.is_vegetarian
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    payment = await db.get(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [order.id]
    );
  }

  return {
    ...res,
    order_id: order ? order.id : null,
    order_status: order ? order.status : null,
    order_type: order ? order.order_type : null,
    subtotal: order ? Number(order.subtotal) : 0,
    tax: order ? Number(order.tax) : 0,
    total_amount: order ? Number(order.total_amount) : 0,
    order_total: order ? Number(order.total_amount) : 0,
    items,
    payment_status: payment ? payment.payment_status : (order ? 'NOT_PAID' : 'NO_PAYMENT_REQUIRED'),
    payment_method: payment ? payment.payment_method : null,
    payment_id: payment ? payment.id : null,
    transaction_reference: payment ? payment.transaction_reference : null,
    paid_at: payment ? payment.created_at : null
  };
};

const getUserReservations = async (userId) => {
  const db = await getDb();
  return db.query(
    `SELECT r.*, t.table_number, rest.name as restaurant_name, loc.address_line1 as restaurant_address, loc.city as restaurant_city, rest.image_url as restaurant_image_url,
            o.id as order_id, o.total_amount as order_total, o.subtotal, o.tax, o.status as order_status,
            p.payment_status, p.transaction_reference, p.created_at as paid_at
     FROM reservations r
     LEFT JOIN tables t ON r.table_id = t.id
     JOIN restaurants rest ON r.restaurant_id = rest.id
     LEFT JOIN restaurant_locations loc ON rest.id = loc.restaurant_id
     LEFT JOIN orders o ON o.reservation_id = r.id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [userId]
  );
};


const getRestaurantReservations = async (restaurantId, status = null) => {
  const db = await getDb();
  let query = `
    SELECT r.*, t.table_number, t.capacity as table_capacity, u.name as user_name, u.phone as user_phone, u.email as user_email
     FROM reservations r
     LEFT JOIN tables t ON r.table_id = t.id
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.restaurant_id = ?
  `;
  const params = [restaurantId];

  if (status && status !== 'ALL') {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.created_at DESC';
  return db.query(query, params);
};

const ALLOWED_RESERVATION_STATUSES = [
  'PENDING', 'CONFIRMED', 'CHECKED_IN', 'SEATED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'
];

const ALLOWED_RESERVATION_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'SEATED', 'COMPLETED', 'PENDING'],
  CONFIRMED: ['CONFIRMED', 'CHECKED_IN', 'SEATED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'REJECTED'],
  CHECKED_IN: ['SEATED', 'CANCELLED', 'NO_SHOW', 'CONFIRMED', 'COMPLETED'],
  SEATED: ['COMPLETED', 'CANCELLED', 'CONFIRMED', 'SEATED'],
  COMPLETED: ['CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'],
  CANCELLED: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  REJECTED: ['PENDING', 'CONFIRMED', 'REJECTED'],
  NO_SHOW: ['CONFIRMED', 'PENDING', 'NO_SHOW']
};


const updateReservationStatus = async (reservationId, status, changedByUserId = null, note = '') => {
  if (!ALLOWED_RESERVATION_STATUSES.includes(status)) {
    const err = new Error(`Invalid status: ${status}. Allowed: ${ALLOWED_RESERVATION_STATUSES.join(', ')}`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const db = await getDb();
  const res = await db.get('SELECT * FROM reservations WHERE id = ?', [reservationId]);
  if (!res) {
    const err = new Error('Reservation not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const prevStatus = res.status;
  const allowed = ALLOWED_RESERVATION_TRANSITIONS[prevStatus] || [];
  if (prevStatus !== status && !allowed.includes(status)) {
    const err = new Error(`Invalid reservation transition from '${prevStatus}' to '${status}'. Allowed: ${allowed.join(', ') || 'NONE'}`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  let updatedTable = null;
  let linkedOrderId = null;
  let orderStatusChanged = false;
  let refundInitiated = false;

  await db.transaction(async (tx) => {
    // 1. Update reservation record
    await tx.run(
      `UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, reservationId]
    );

    // 2. Add history record
    await tx.run(
      `INSERT INTO reservation_status_history (id, reservation_id, previous_status, new_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), reservationId, prevStatus, status, changedByUserId, note]
    );

    // 3. Handle table status synchronization
    if (res.table_id) {
      if (status === 'SEATED') {
        await tx.run(`UPDATE tables SET status = 'OCCUPIED', occupied_since = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [res.table_id]);
      } else if (status === 'COMPLETED') {
        await tx.run(`UPDATE tables SET status = 'CLEANING', occupied_since = NULL, current_reservation_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [res.table_id]);
      } else if (status === 'CANCELLED' || status === 'REJECTED' || status === 'NO_SHOW') {
        // Release table back to AVAILABLE
        await tx.run(`UPDATE tables SET status = 'AVAILABLE', occupied_since = NULL, current_reservation_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [res.table_id]);
      } else if (status === 'CONFIRMED') {
        await tx.run(`UPDATE tables SET status = 'RESERVED', current_reservation_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [reservationId, res.table_id]);
      }

      updatedTable = await tx.get('SELECT * FROM tables WHERE id = ?', [res.table_id]);
    }

    // 4. Handle Linked Food Pre-Order & Payment Synchronization
    const linkedOrder = await tx.get(
      'SELECT * FROM orders WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1',
      [reservationId]
    );

    if (linkedOrder) {
      linkedOrderId = linkedOrder.id;

      if (status === 'CANCELLED' || status === 'REJECTED') {
        // Only cancel if not already completed/served
        if (linkedOrder.status !== 'SERVED' && linkedOrder.status !== 'CANCELLED') {
          await tx.run(
            `UPDATE orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [linkedOrder.id]
          );
          orderStatusChanged = true;

          // Check payment status for refund audit
          const payment = await tx.get(
            'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [linkedOrder.id]
          );

          if (payment) {
            if (payment.payment_status === 'SUCCESS' || payment.payment_status === 'PAID') {
              await tx.run(
                `UPDATE payments SET payment_status = 'REFUND_PENDING' WHERE id = ?`,
                [payment.id]
              );
              refundInitiated = true;
            } else if (payment.payment_status === 'PENDING') {
              await tx.run(
                `UPDATE payments SET payment_status = 'CANCELLED' WHERE id = ?`,
                [payment.id]
              );
            }
          }
        }
      } else if (status === 'CONFIRMED') {
        // If reservation is confirmed, confirm linked pending order
        if (linkedOrder.status === 'PENDING') {
          await tx.run(
            `UPDATE orders SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [linkedOrder.id]
          );
          orderStatusChanged = true;
        }
      } else if (status === 'SEATED') {
        // When customer is seated, advance order to PREPARING if not already cooking/served
        if (linkedOrder.status === 'CONFIRMED' || linkedOrder.status === 'PENDING') {
          await tx.run(
            `UPDATE orders SET status = 'PREPARING', prep_start_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [linkedOrder.id]
          );
          orderStatusChanged = true;
        }
      }
    }
  });

  // Fetch full updated reservation with order, items, and payment details
  const updatedRes = await getReservationById(reservationId);

  // 1. Broadcast Reservation Update
  emitReservationUpdated(res.user_id, res.restaurant_id, updatedRes);
  emitToRoom(res.restaurant_id, 'reservation_updated', updatedRes);
  emitToRoom(`restaurant:${res.restaurant_id}`, 'reservation_updated', updatedRes);
  if (res.user_id) {
    emitToRoom(`user:${res.user_id}`, 'reservation_updated', updatedRes);
  }

  // 2. Broadcast Table Status Change (if table was updated/released)
  if (updatedTable) {
    emitTableStatusChanged(res.restaurant_id, updatedTable);
  }

  // 3. Broadcast Linked Order & Receipt Status Change
  if (linkedOrderId && orderStatusChanged) {
    const updatedOrder = await db.get(
      `SELECT o.*, rest.name as restaurant_name, t.table_number, u.name as user_name, u.phone as user_phone, u.email as user_email
       FROM orders o
       JOIN restaurants rest ON o.restaurant_id = rest.id
       JOIN users u ON o.user_id = u.id
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE o.id = ?`,
      [linkedOrderId]
    );

    const orderItems = await db.query(
      `SELECT oi.*, COALESCE(oi.unit_price, mi.price, 0) as price, COALESCE(oi.item_name, mi.name) as name, mi.image_url as item_image, mi.is_vegetarian
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [linkedOrderId]
    );

    const fullOrder = { ...updatedOrder, items: orderItems };

    emitOrderStatusChanged(res.user_id, res.restaurant_id, fullOrder);
    emitToRoom(res.restaurant_id, 'order_status_changed', fullOrder);
    emitToRoom(`restaurant:${res.restaurant_id}`, 'order_status_changed', fullOrder);
    if (res.user_id) {
      emitToRoom(`user:${res.user_id}`, 'order_status_changed', fullOrder);
    }
    emitToRoom(res.restaurant_id, 'order_cancelled', fullOrder);
    emitToRoom(`restaurant:${res.restaurant_id}`, 'order_cancelled', fullOrder);
    emitToRoom(res.restaurant_id, 'receipt_updated', {
      reservationId,
      orderId: linkedOrderId,
      status: updatedRes.status,
      orderStatus: updatedRes.order_status,
      paymentStatus: updatedRes.payment_status,
      refundInitiated
    });
  }

  // 4. Notify User if applicable
  if (res.user_id) {
    let notifTitle = 'Reservation Status Update';
    let notifMsg = `Your table reservation status is now ${status}.`;

    if (status === 'CONFIRMED') {
      notifTitle = 'Reservation Confirmed! 🎉';
      notifMsg = `Your table at ${updatedRes.restaurant_name} has been approved by the restaurant. Table #${updatedRes.table_number || 'T-01'} is reserved for you.`;
    } else if (status === 'CANCELLED' || status === 'REJECTED') {
      notifTitle = 'Reservation Cancelled';
      if (refundInitiated) {
        notifMsg = `Your table reservation and food order at ${updatedRes.restaurant_name} were cancelled. A refund of ₹${updatedRes.total_amount || updatedRes.order_total || 0} has been marked for processing.`;
      } else {
        notifMsg = `Your table reservation at ${updatedRes.restaurant_name} was cancelled/declined.`;
      }
    } else if (status === 'SEATED') {
      notifTitle = 'Welcome! Enjoy your meal 🍽️';
      notifMsg = `You are now checked in and seated at Table #${updatedRes.table_number || 'T-01'}.`;
    }

    await createNotification({
      userId: res.user_id,
      title: notifTitle,
      message: notifMsg,
      type: 'RESERVATION',
      referenceId: reservationId,
      referenceType: 'RESERVATION'
    }).catch(e => console.error('Notification error:', e));
  }

  return updatedRes;
};

module.exports = {
  createReservation,
  getReservationById,
  getUserReservations,
  getRestaurantReservations,
  getReservationsByRestaurant: getRestaurantReservations,
  updateReservationStatus
};

