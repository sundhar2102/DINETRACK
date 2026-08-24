const { getDb } = require('../../database/db');
const crypto = require('crypto');

const getOffersByRestaurant = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    'SELECT * FROM offers WHERE restaurant_id = ? ORDER BY created_at DESC',
    [restaurantId]
  );
};

const getActiveOffers = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT * FROM offers 
     WHERE restaurant_id = ? AND is_active = 1 
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
     ORDER BY discount_value DESC`,
    [restaurantId]
  );
};

const validateCoupon = async (restaurantId, code, orderAmount) => {
  const db = await getDb();
  const offer = await db.get(
    `SELECT * FROM offers 
     WHERE restaurant_id = ? AND UPPER(code) = UPPER(?) AND is_active = 1
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)`,
    [restaurantId, code.trim()]
  );

  if (!offer) {
    const err = new Error('Invalid or expired coupon code');
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  if (Number(orderAmount) < Number(offer.min_order_amount)) {
    const err = new Error(`Minimum order amount of $${Number(offer.min_order_amount).toFixed(2)} required for this offer.`);
    err.statusCode = 400;
    err.isOperational = true;
    throw err;
  }

  let discountAmount = 0;
  if (offer.discount_type === 'PERCENT') {
    discountAmount = (Number(orderAmount) * Number(offer.discount_value)) / 100;
    if (offer.max_discount && discountAmount > Number(offer.max_discount)) {
      discountAmount = Number(offer.max_discount);
    }
  } else {
    discountAmount = Number(offer.discount_value);
  }

  discountAmount = Math.min(discountAmount, Number(orderAmount));

  return {
    offer,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round((Number(orderAmount) - discountAmount) * 100) / 100
  };
};

const createOffer = async (restaurantId, data) => {
  const db = await getDb();
  const offerId = crypto.randomUUID();

  await db.run(
    `INSERT INTO offers (id, restaurant_id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_until, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [offerId, restaurantId, data.code.toUpperCase().trim(), data.description || '', data.discount_type || 'PERCENT', data.discount_value, data.min_order_amount || 0, data.max_discount || null, data.valid_until || null]
  );

  return db.get('SELECT * FROM offers WHERE id = ?', [offerId]);
};

const toggleOfferStatus = async (offerId) => {
  const db = await getDb();
  const offer = await db.get('SELECT * FROM offers WHERE id = ?', [offerId]);
  if (!offer) throw new Error('Offer not found');

  const newStatus = offer.is_active ? 0 : 1;
  await db.run('UPDATE offers SET is_active = ? WHERE id = ?', [newStatus, offerId]);
  return db.get('SELECT * FROM offers WHERE id = ?', [offerId]);
};

const deleteOffer = async (offerId) => {
  const db = await getDb();
  await db.run('DELETE FROM offers WHERE id = ?', [offerId]);
  return { success: true };
};

const getAllPublicOffers = async () => {
  const db = await getDb();
  return db.query(
    `SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image, r.cuisine as restaurant_cuisine, loc.address_line1 as restaurant_address
     FROM offers o 
     JOIN restaurants r ON o.restaurant_id = r.id 
     LEFT JOIN restaurant_locations loc ON r.id = loc.restaurant_id
     WHERE o.is_active = 1 AND (o.valid_until IS NULL OR o.valid_until >= CURRENT_TIMESTAMP)
     ORDER BY o.discount_value DESC`
  );
};


module.exports = {
  getOffersByRestaurant,
  getActiveOffers,
  getAllPublicOffers,
  validateCoupon,
  createOffer,
  toggleOfferStatus,
  deleteOffer
};
