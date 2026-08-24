const crypto = require('crypto');
const { getDb } = require('../../database/db');
const { emitToRoom, emitOrderStatusChanged, emitReservationUpdated } = require('../sockets/socketEmitter');
const { createNotification } = require('./notification.service');

/**
 * Creates a payment order for a reservation / order.
 * Strictly uses database prices as authoritative source of truth.
 */
const createPaymentOrder = async ({ userId, reservationId, orderId }) => {
  const db = await getDb();

  let targetOrder = null;
  let targetReservation = null;

  if (reservationId) {
    targetReservation = await db.get('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    if (!targetReservation) {
      const err = new Error('Reservation not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (targetReservation.user_id !== userId) {
      const err = new Error('Unauthorized: You can only pay for your own reservation');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    targetOrder = await db.get(
      'SELECT * FROM orders WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1',
      [reservationId]
    );
  } else if (orderId) {
    targetOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!targetOrder) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (targetOrder.user_id !== userId) {
      const err = new Error('Unauthorized: You can only pay for your own order');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    if (targetOrder.reservation_id) {
      targetReservation = await db.get('SELECT * FROM reservations WHERE id = ?', [targetOrder.reservation_id]);
    }
  } else {
    const err = new Error('Either reservationId or orderId is required');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  if (!targetOrder) {
    const err = new Error('No payable order found for this booking');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Check if already paid
  const existingPayment = await db.get(
    'SELECT * FROM payments WHERE order_id = ? AND payment_status = "SUCCESS"',
    [targetOrder.id]
  );
  if (existingPayment) {
    return {
      alreadyPaid: true,
      paymentId: existingPayment.id,
      amount: existingPayment.amount,
      transactionReference: existingPayment.transaction_reference,
      paymentStatus: 'SUCCESS'
    };
  }

  const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', [targetOrder.restaurant_id]);
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

  const amountInRupees = Number(targetOrder.total_amount);
  const amountInPaise = Math.round(amountInRupees * 100);

  // Razorpay configuration
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_DineTrackSandbox';
  const gatewayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

  return {
    alreadyPaid: false,
    orderId: targetOrder.id,
    reservationId: targetReservation ? targetReservation.id : null,
    restaurantId: targetOrder.restaurant_id,
    restaurantName: restaurant ? restaurant.name : 'Restaurant',
    amount: amountInRupees,
    amountInPaise,
    currency: 'INR',
    gatewayOrderId,
    keyId,
    customerName: user ? user.name : 'Guest',
    customerEmail: user ? user.email : '',
    customerPhone: user ? (user.phone || '') : '',
    subtotal: Number(targetOrder.subtotal),
    tax: Number(targetOrder.tax),
    notes: {
      reservationId: targetReservation ? targetReservation.id : '',
      orderId: targetOrder.id
    }
  };
};

/**
 * Verifies Razorpay payment signature & records successful payment in database
 */
const verifyPayment = async ({
  userId,
  reservationId,
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  paymentMethod = 'ONLINE_UPI'
}) => {
  const db = await getDb();

  let targetOrder = null;
  let targetReservation = null;

  if (reservationId) {
    targetReservation = await db.get('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    if (!targetReservation) {
      const err = new Error('Reservation not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    if (targetReservation.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }
    targetOrder = await db.get('SELECT * FROM orders WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1', [reservationId]);
  } else if (orderId) {
    targetOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!targetOrder) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    if (targetOrder.user_id !== userId) {
      const err = new Error('Unauthorized');
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }
    if (targetOrder.reservation_id) {
      targetReservation = await db.get('SELECT * FROM reservations WHERE id = ?', [targetOrder.reservation_id]);
    }
  }

  if (!targetOrder) {
    const err = new Error('Target order not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  // Cryptographic Signature Verification if secret is provided
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (secret && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      const err = new Error('Invalid payment signature verification failed');
      err.statusCode = 400;
      err.isOperational = true;
      throw err;
    }
  }

  const paymentId = crypto.randomUUID();
  const txnRef = razorpayPaymentId || `TXN_RZP_${Date.now()}`;
  const totalAmount = Number(targetOrder.total_amount);

  await db.transaction(async (tx) => {
    // Delete any previous pending payment for this order
    await tx.run('DELETE FROM payments WHERE order_id = ? AND payment_status != "SUCCESS"', [targetOrder.id]);

    // Insert successful payment record
    await tx.run(
      `INSERT INTO payments (id, order_id, user_id, restaurant_id, amount, payment_method, payment_status, transaction_reference)
       VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
      [
        paymentId,
        targetOrder.id,
        userId,
        targetOrder.restaurant_id,
        totalAmount,
        paymentMethod,
        txnRef
      ]
    );

    // Update order status if it was pending
    if (targetOrder.status === 'PENDING') {
      await tx.run('UPDATE orders SET status = "CONFIRMED", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [targetOrder.id]);
    }
  });

  const updatedPayment = await db.get('SELECT * FROM payments WHERE id = ?', [paymentId]);
  const restaurant = await db.get('SELECT name FROM restaurants WHERE id = ?', [targetOrder.restaurant_id]);

  // Real-time notifications and socket events
  const socketPayload = {
    reservationId: targetReservation ? targetReservation.id : null,
    orderId: targetOrder.id,
    paymentStatus: 'SUCCESS',
    amount: totalAmount,
    transactionReference: txnRef,
    paidAt: new Date().toISOString()
  };

  emitToRoom(`restaurant:${targetOrder.restaurant_id}`, 'payment_received', socketPayload);
  emitToRoom(`user:${userId}`, 'payment_success', socketPayload);

  if (targetReservation) {
    emitReservationUpdated(userId, targetOrder.restaurant_id, {
      ...targetReservation,
      payment_status: 'SUCCESS',
      order_total: totalAmount
    });
  }

  await createNotification({
    userId,
    title: 'Payment Successful! 💳',
    message: `Payment of ₹${totalAmount.toFixed(0)} for your booking at ${restaurant ? restaurant.name : 'the restaurant'} was successful. Ref: ${txnRef.slice(0, 16)}`,
    type: 'PAYMENT_SUCCESS',
    referenceId: targetReservation ? targetReservation.id : targetOrder.id,
    referenceType: 'PAYMENT'
  }).catch(e => console.error('Notification error:', e));

  return {
    paymentId,
    paymentStatus: 'SUCCESS',
    amount: totalAmount,
    paymentMethod,
    transactionReference: txnRef,
    paidAt: updatedPayment ? updatedPayment.created_at : new Date().toISOString()
  };
};

/**
 * Gets payment record by reservation ID
 */
const getPaymentByReservationId = async (reservationId, userId) => {
  const db = await getDb();

  const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [reservationId]);
  if (!reservation) {
    const err = new Error('Reservation not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  if (reservation.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    err.isOperational = true;
    throw err;
  }

  const order = await db.get('SELECT * FROM orders WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1', [reservationId]);
  if (!order) {
    return {
      hasOrder: false,
      paymentStatus: 'NO_PAYMENT_REQUIRED'
    };
  }

  const payment = await db.get('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [order.id]);

  return {
    hasOrder: true,
    orderId: order.id,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    totalAmount: Number(order.total_amount),
    paymentStatus: payment ? payment.payment_status : 'NOT_PAID',
    paymentMethod: payment ? payment.payment_method : null,
    transactionReference: payment ? payment.transaction_reference : null,
    paidAt: payment ? payment.created_at : null
  };
};

/**
 * Process refund for a cancelled paid order/reservation
 */
const processRefund = async ({ reservationId, orderId, processedByUserId = null, refundReason = 'Reservation cancelled by owner/customer' }) => {
  const db = await getDb();

  let targetPayment = null;
  let targetOrder = null;
  let targetReservation = null;

  if (reservationId) {
    targetReservation = await db.get('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    if (!targetReservation) {
      const err = new Error('Reservation not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    targetOrder = await db.get('SELECT * FROM orders WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1', [reservationId]);
  } else if (orderId) {
    targetOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!targetOrder) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    if (targetOrder.reservation_id) {
      targetReservation = await db.get('SELECT * FROM reservations WHERE id = ?', [targetOrder.reservation_id]);
    }
  }

  if (!targetOrder) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    err.isOperational = true;
    throw err;
  }

  targetPayment = await db.get(
    'SELECT * FROM payments WHERE order_id = ? AND (payment_status = "SUCCESS" OR payment_status = "REFUND_PENDING") ORDER BY created_at DESC LIMIT 1',
    [targetOrder.id]
  );

  if (!targetPayment) {
    const err = new Error('No eligible paid transaction found to refund');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  const refundReference = `RFD_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  await db.transaction(async (tx) => {
    await tx.run(
      `UPDATE payments 
       SET payment_status = 'REFUNDED', 
           transaction_reference = ? 
       WHERE id = ?`,
      [`${targetPayment.transaction_reference || 'TXN'}|${refundReference}`, targetPayment.id]
    );
  });

  const updatedPayment = await db.get('SELECT * FROM payments WHERE id = ?', [targetPayment.id]);
  const restaurant = await db.get('SELECT name FROM restaurants WHERE id = ?', [targetOrder.restaurant_id]);

  // Broadcast real-time refund event
  const refundPayload = {
    reservationId: targetReservation ? targetReservation.id : null,
    orderId: targetOrder.id,
    paymentStatus: 'REFUNDED',
    amount: targetPayment.amount,
    refundReference,
    refundedAt: new Date().toISOString()
  };

  emitToRoom(`restaurant:${targetOrder.restaurant_id}`, 'refund_processed', refundPayload);
  if (targetPayment.user_id) {
    emitToRoom(`user:${targetPayment.user_id}`, 'refund_processed', refundPayload);
    emitReservationUpdated(targetPayment.user_id, targetOrder.restaurant_id, {
      ...targetReservation,
      payment_status: 'REFUNDED'
    });

    await createNotification({
      userId: targetPayment.user_id,
      title: 'Refund Processed 💸',
      message: `Your refund of ₹${Number(targetPayment.amount).toFixed(0)} for ${restaurant ? restaurant.name : 'your reservation'} has been credited. Ref: ${refundReference}`,
      type: 'PAYMENT_REFUNDED',
      referenceId: targetReservation ? targetReservation.id : targetOrder.id,
      referenceType: 'PAYMENT'
    }).catch(e => console.error('Notification error:', e));
  }

  return {
    paymentId: targetPayment.id,
    paymentStatus: 'REFUNDED',
    amount: targetPayment.amount,
    refundReference,
    refundedAt: new Date().toISOString()
  };
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentByReservationId,
  processRefund
};
