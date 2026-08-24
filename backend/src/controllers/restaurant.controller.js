const restaurantService = require('../services/restaurant.service');
const { successResponse, errorResponse } = require('../utils/response');

const getNearbyRestaurants = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm, cuisine, minRating, priceRange, search, maxWaitTime, sortBy } = req.query;
    const restaurants = await restaurantService.getNearbyRestaurants({
      lat,
      lng,
      radiusKm,
      cuisine,
      minRating,
      priceRange,
      search,
      maxWaitTime,
      sortBy
    });
    return successResponse(res, restaurants, 'Nearby restaurants retrieved');
  } catch (error) {
    next(error);
  }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;
    const restaurant = await restaurantService.getRestaurantById(id, lat, lng);
    return successResponse(res, restaurant);
  } catch (error) {
    next(error);
  }
};

const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.user.id, req.body);
    return successResponse(res, restaurant, 'Restaurant created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await restaurantService.updateRestaurant(id, req.body);
    return successResponse(res, restaurant, 'Restaurant updated successfully');
  } catch (error) {
    next(error);
  }
};

const { estimateWaitTime } = require('../services/waitTime.service');

const getWaitTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { partySize } = req.query;
    const waitInfo = await estimateWaitTime(id, parseInt(partySize, 10) || 2);
    return successResponse(res, waitInfo, 'Wait time estimated successfully');
  } catch (error) {
    next(error);
  }
};

const clearLiveOperationalData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { getDb } = require('../../database/db');
    const db = await getDb();

    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM waitlist WHERE restaurant_id = ?', [id]);
      await tx.run('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = ?)', [id]);
      await tx.run('DELETE FROM payments WHERE restaurant_id = ?', [id]);
      await tx.run('DELETE FROM orders WHERE restaurant_id = ?', [id]);
      await tx.run('DELETE FROM reservation_status_history WHERE reservation_id IN (SELECT id FROM reservations WHERE restaurant_id = ?)', [id]);
      await tx.run('DELETE FROM reservations WHERE restaurant_id = ?', [id]);
      await tx.run(`UPDATE tables SET status = 'AVAILABLE', current_reservation_id = NULL, occupied_since = NULL WHERE restaurant_id = ?`, [id]);
    });

    return successResponse(res, { cleared: true }, 'All queue, orders, and reservations cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getWaitTime,
  clearLiveOperationalData
};

