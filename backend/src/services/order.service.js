const { getDb } = require('../../database/db');
const { emitOrderCreated, emitOrderStatusChanged, emitFoodReady } = require('../sockets/socketEmitter');
const { createNotification } = require('./notification.service');
const crypto = require('crypto');

const createOrder = async ({
  userId,
  restaurantId,
  reservationId = null,
  tableId = null,
  orderType = 'PRE_ORDER',
  items = [],
  specialInstructions = '',
  paymentMethod = 'ONLINE_CARD'
}) => {
  const db = await getDb();
  const orderId = crypto.randomUUID();

  let subtotal = 0;
  for (const item of items) {
    subtotal += Number(item.price) * Number(item.quantity);
  }
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = subtotal + tax;
  const maxPrep = items.length > 0 ? Math.max(...items.map(i => Number(i.prep_time_minutes || 15))) : 15;

  await db.transaction(async (tx) => {
    // ALWAYS start orders in 'PENDING' status (No auto-confirm)
    await tx.run(
      `INSERT INTO orders (id, restaurant_id, user_id, reservation_id, table_id, order_type, status, subtotal, tax, total_amount, special_instructions, estimated_prep_time_minutes)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
      [orderId, restaurantId, userId, reservationId, tableId, orderType, subtotal, tax, totalAmount, specialInstructions, maxPrep]
    );

    for (const item of items) {
      let menuItemId = item.id || item.menu_item_id;
      let exists = await tx.get('SELECT id FROM menu_items WHERE id = ?', [menuItemId]);
      if (!exists) {
        const fallback = await tx.get('SELECT id FROM menu_items WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
        menuItemId = fallback ? fallback.id : null;
      }
      if (menuItemId) {
        await tx.run(
          `INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, total_price, customization_notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), orderId, menuItemId, item.name, item.quantity, item.price, Number(item.price) * Number(item.quantity), item.customization || '']
        );
      }
    }


    // Record Payment
    await tx.run(
      `INSERT INTO payments (id, order_id, user_id, restaurant_id, amount, payment_method, payment_status, transaction_reference)
       VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
      [crypto.randomUUID(), orderId, userId, restaurantId, totalAmount, paymentMethod, 'TXN_ST_' + Date.now()]
    );
  });

  const order = await getOrderById(orderId);

  // Emit real-time events
  emitOrderCreated(restaurantId, order);
  emitOrderStatusChanged(userId, restaurantId, order);

  await createNotification({
    userId,
    title: 'Order Placed (Awaiting Approval) ⏳',
    message: `Your order (#${orderId.slice(0, 8)}) for ₹${totalAmount.toFixed(0)} is pending restaurant confirmation.`,
    type: 'ORDER_PENDING',
    referenceId: orderId,
    referenceType: 'ORDER'
  });

  return order;
};

const getOrderById = async (orderId) => {
  const db = await getDb();
  const order = await db.get(
    `SELECT o.*, rest.name as restaurant_name, rest.image_url as restaurant_image,
            t.table_number, u.name as user_name, u.phone as user_phone, u.email as user_email
     FROM orders o
     JOIN restaurants rest ON o.restaurant_id = rest.id
     JOIN users u ON o.user_id = u.id
     LEFT JOIN tables t ON o.table_id = t.id
     WHERE o.id = ?`,
    [orderId]
  );

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  const items = await db.query(
    `SELECT oi.*, 
            COALESCE(oi.unit_price, mi.price, 0) as price, 
            COALESCE(oi.unit_price, mi.price, 0) as unit_price, 
            COALESCE(oi.total_price, (oi.unit_price * oi.quantity), (mi.price * oi.quantity), 0) as total_price,
            COALESCE(oi.item_name, mi.name, 'Chef Special Dish') as name,
            COALESCE(oi.item_name, mi.name, 'Chef Special Dish') as item_name,
            mi.image_url as item_image, mi.is_vegetarian, mi.prep_time_minutes 
     FROM order_items oi
     LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return {
    ...order,
    items
  };
};

const getRestaurantOrders = async (restaurantId, status = null) => {
  const db = await getDb();
  let query = `
    SELECT o.*, t.table_number, u.name as user_name, u.phone as user_phone,
           r.reservation_time, r.guest_count
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN reservations r ON o.reservation_id = r.id
    WHERE o.restaurant_id = ?
  `;
  const params = [restaurantId];

  if (status && status !== 'ALL') {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC';
  const orders = await db.query(query, params);

  // Fetch items for all returned orders
  const results = [];
  for (const ord of orders) {
    const items = await db.query(
      `SELECT oi.*, 
              COALESCE(oi.unit_price, mi.price, 0) as price, 
              COALESCE(oi.unit_price, mi.price, 0) as unit_price, 
              COALESCE(oi.total_price, (oi.unit_price * oi.quantity), (mi.price * oi.quantity), 0) as total_price,
              COALESCE(oi.item_name, mi.name, 'Chef Special Dish') as name,
              COALESCE(oi.item_name, mi.name, 'Chef Special Dish') as item_name,
              mi.image_url as item_image, mi.is_vegetarian, mi.prep_time_minutes 
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [ord.id]
    );
    results.push({ ...ord, items });
  }

  return results;
};

const getUserOrders = async (userId) => {
  const db = await getDb();
  const orders = await db.query(
    `SELECT o.*, rest.name as restaurant_name, rest.image_url as restaurant_image, t.table_number
     FROM orders o
     JOIN restaurants rest ON o.restaurant_id = rest.id
     LEFT JOIN tables t ON o.table_id = t.id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  const results = [];
  for (const ord of orders) {
    const items = await db.query(
      `SELECT oi.*, 
              COALESCE(oi.unit_price, 0) as price, 
              COALESCE(oi.unit_price, 0) as unit_price, 
              COALESCE(oi.total_price, (oi.unit_price * oi.quantity), 0) as total_price,
              oi.item_name as name, oi.item_name 
       FROM order_items oi 
       WHERE oi.order_id = ?`,
      [ord.id]
    );
    results.push({ ...ord, items });
  }
  return results;
};


const updateOrderStatus = async (orderId, newStatus) => {
  const db = await getDb();
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  let prepStartTime = order.prep_start_time;
  let readyTime = order.ready_time;

  if (newStatus === 'PREPARING' && !prepStartTime) {
    prepStartTime = new Date().toISOString();
  } else if (newStatus === 'READY' && !readyTime) {
    readyTime = new Date().toISOString();
  }

  await db.run(
    `UPDATE orders SET status = ?, prep_start_time = ?, ready_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newStatus, prepStartTime, readyTime, orderId]
  );

  const updatedOrder = await getOrderById(orderId);

  // Emit live socket update
  emitOrderStatusChanged(order.user_id, order.restaurant_id, updatedOrder);
  if (newStatus === 'READY') {
    emitFoodReady(order.user_id, order.restaurant_id, updatedOrder);
  }

  // Create In-App Notification based on status
  if (newStatus === 'CONFIRMED') {
    await createNotification({
      userId: order.user_id,
      title: 'Order Confirmed by Restaurant! 🍲',
      message: `Your food order (#${orderId.slice(0, 8)}) has been accepted and approved by the restaurant.`,
      type: 'ORDER_CONFIRMED',
      referenceId: orderId,
      referenceType: 'ORDER'
    });
  } else if (newStatus === 'PREPARING') {
    await createNotification({
      userId: order.user_id,
      title: 'Kitchen is Cooking! 👨‍🍳',
      message: `The chef at ${updatedOrder.restaurant_name} has started preparing your dishes.`,
      type: 'FOOD_PREPARING',
      referenceId: orderId,
      referenceType: 'ORDER'
    });
  } else if (newStatus === 'READY') {
    await createNotification({
      userId: order.user_id,
      title: 'Food is Ready! 🍽️',
      message: `Your food at ${updatedOrder.restaurant_name} is hot, ready and prepared.`,
      type: 'FOOD_READY',
      referenceId: orderId,
      referenceType: 'ORDER'
    });
  } else if (newStatus === 'SERVED') {
    await createNotification({
      userId: order.user_id,
      title: 'Bon Appétit! ✨',
      message: `Your order has been served. Enjoy your meal at ${updatedOrder.restaurant_name}!`,
      type: 'FOOD_SERVED',
      referenceId: orderId,
      referenceType: 'ORDER'
    });
  } else if (newStatus === 'CANCELLED') {
    await createNotification({
      userId: order.user_id,
      title: 'Order Cancelled / Declined',
      message: `Your food order (#${orderId.slice(0, 8)}) was declined by the restaurant.`,
      type: 'ORDER_CANCELLED',
      referenceId: orderId,
      referenceType: 'ORDER'
    });
  }

  return updatedOrder;
};

module.exports = {
  createOrder,
  getOrderById,
  getRestaurantOrders,
  getUserOrders,
  updateOrderStatus
};
