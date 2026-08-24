const reservationService = require('../services/reservation.service');
const { successResponse, errorResponse } = require('../utils/response');

const createReservation = async (req, res, next) => {
  try {
    const {
      restaurantId,
      guestCount,
      reservationDate,
      reservationTime,
      tableId,
      specialRequests,
      estimatedArrivalMinutes,
      preOrderItems,
      paymentMethod
    } = req.body;

    if (!restaurantId || !guestCount || !reservationDate || !reservationTime) {
      return errorResponse(res, 'Restaurant, guest count, date, and time are required', 400);
    }

    const reservation = await reservationService.createReservation({
      userId: req.user.id,
      restaurantId,
      guestCount: parseInt(guestCount, 10),
      reservationDate,
      reservationTime,
      tableId,
      specialRequests,
      estimatedArrivalMinutes: parseInt(estimatedArrivalMinutes || 15, 10),
      preOrderItems,
      paymentMethod
    });

    return successResponse(res, reservation, 'Reservation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getRestaurantReservations = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;
    const reservations = await reservationService.getReservationsByRestaurant(restaurantId, status);
    return successResponse(res, reservations);
  } catch (error) {
    next(error);
  }
};

const getUserReservations = async (req, res, next) => {
  try {
    const reservations = await reservationService.getUserReservations(req.user.id);
    return successResponse(res, reservations);
  } catch (error) {
    next(error);
  }
};

const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await reservationService.getReservationById(id);
    return successResponse(res, reservation);
  } catch (error) {
    next(error);
  }
};

const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }
    const updated = await reservationService.updateReservationStatus(id, status, req.user.id);
    return successResponse(res, updated, 'Reservation status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getRestaurantReservations,
  getUserReservations,
  getReservationById,
  updateReservationStatus
};
