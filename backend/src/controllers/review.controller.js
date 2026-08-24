const { getDb } = require('../../database/db');
const { successResponse, errorResponse } = require('../utils/response');
const { emitReviewCreated } = require('../sockets/socketEmitter');
const crypto = require('crypto');

const createReview = async (req, res, next) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    if (!restaurantId || !rating) {
      return errorResponse(res, 'Restaurant and rating are required', 400);
    }
    const db = await getDb();
    const reviewId = crypto.randomUUID();

    await db.run(
      `INSERT INTO reviews (id, restaurant_id, user_id, user_name, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewId, restaurantId, req.user.id, req.user.name, parseInt(rating, 10), comment || '']
    );

    // Update restaurant average rating
    const avgRow = await db.get(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_count FROM reviews WHERE restaurant_id = ?',
      [restaurantId]
    );
    if (avgRow) {
      await db.run(
        'UPDATE restaurants SET rating = ?, rating_count = ? WHERE id = ?',
        [Math.round(avgRow.avg_rating * 10) / 10, avgRow.total_count, restaurantId]
      );
    }

    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    emitReviewCreated(restaurantId, review);
    return successResponse(res, review, 'Review submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMenuByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const db = await getDb();

    const categories = await db.query(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY display_order ASC',
      [restaurantId]
    );
    const items = await db.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY name ASC',
      [restaurantId]
    );

    const categoriesWithItems = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));

    return successResponse(res, { categories: categoriesWithItems, items });
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const { 
      restaurant_id, 
      restaurantId, 
      category_id, 
      categoryId, 
      name, 
      description, 
      price, 
      prep_time_minutes, 
      is_vegetarian, 
      is_vegan, 
      is_gluten_free, 
      image_url, 
      spiciness_level 
    } = req.body;
    
    const db = await getDb();
    const itemId = crypto.randomUUID();
    const restId = restaurant_id || restaurantId || req.user?.restaurant?.id || 'rest-001';
    let catId = category_id || categoryId;

    if (!catId || catId === '') {
      // Find or create default category for this restaurant
      const existingCat = await db.get('SELECT id FROM menu_categories WHERE restaurant_id = ? LIMIT 1', [restId]);
      if (existingCat) {
        catId = existingCat.id;
      } else {
        const newCatId = crypto.randomUUID();
        await db.run(
          `INSERT INTO menu_categories (id, restaurant_id, name, description, display_order, is_active) VALUES (?, ?, 'Chef Specials', 'Featured house specialties', 1, 1)`,
          [newCatId, restId]
        );
        catId = newCatId;
      }
    }

    await db.run(
      `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, prep_time_minutes, is_vegetarian, is_vegan, is_gluten_free, is_available, image_url, spiciness_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        itemId, 
        restId, 
        catId, 
        name || 'New Special Dish', 
        description || '', 
        parseFloat(price) || 199.00, 
        parseInt(prep_time_minutes, 10) || 15, 
        is_vegetarian ? 1 : 0, 
        is_vegan ? 1 : 0, 
        is_gluten_free ? 1 : 0, 
        image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 
        spiciness_level || 'MILD'
      ]
    );

    const item = await db.get('SELECT * FROM menu_items WHERE id = ?', [itemId]);
    return successResponse(res, item, 'Menu item created', 201);
  } catch (error) {
    next(error);
  }
};


const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const { name, description, price, prep_time_minutes, is_vegetarian, is_vegan, is_gluten_free, is_available, image_url, spiciness_level } = req.body;

    await db.run(
      `UPDATE menu_items SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        prep_time_minutes = COALESCE(?, prep_time_minutes),
        is_vegetarian = COALESCE(?, is_vegetarian),
        is_vegan = COALESCE(?, is_vegan),
        is_gluten_free = COALESCE(?, is_gluten_free),
        is_available = COALESCE(?, is_available),
        image_url = COALESCE(?, image_url),
        spiciness_level = COALESCE(?, spiciness_level),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, price, prep_time_minutes, is_vegetarian, is_vegan, is_gluten_free, is_available, image_url, spiciness_level, id]
    );

    const updated = await db.get('SELECT * FROM menu_items WHERE id = ?', [id]);
    return successResponse(res, updated, 'Menu item updated');
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('DELETE FROM menu_items WHERE id = ?', [id]);
    return successResponse(res, null, 'Menu item deleted');
  } catch (error) {
    next(error);
  }
};

const getReviewsByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const db = await getDb();
    const reviews = await db.query(
      `SELECT r.*, rp.reply_text, rp.created_at as reply_created_at 
       FROM reviews r
       LEFT JOIN review_replies rp ON r.id = rp.review_id
       WHERE r.restaurant_id = ?
       ORDER BY r.created_at DESC`,
      [restaurantId]
    );
    return successResponse(res, reviews);
  } catch (error) {
    next(error);
  }
};

const replyToReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;
    if (!replyText) {
      return errorResponse(res, 'Reply text is required', 400);
    }
    const db = await getDb();
    const replyId = crypto.randomUUID();

    await db.run(
      `INSERT INTO review_replies (id, review_id, user_id, reply_text)
       VALUES (?, ?, ?, ?)`,
      [replyId, reviewId, req.user.id, replyText]
    );

    const reply = await db.get('SELECT * FROM review_replies WHERE id = ?', [replyId]);
    return successResponse(res, reply, 'Reply posted successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviewsByRestaurant,
  replyToReview,
  getMenuByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};

