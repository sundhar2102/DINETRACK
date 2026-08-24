const offersService = require('../services/offers.service');
const { successResponse, errorResponse } = require('../utils/response');

const getOffersByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const offers = await offersService.getOffersByRestaurant(restaurantId);
    return successResponse(res, offers);
  } catch (err) {
    next(err);
  }
};

const getActiveOffers = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const offers = await offersService.getActiveOffers(restaurantId);
    return successResponse(res, offers);
  } catch (err) {
    next(err);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const { restaurantId, code, orderAmount } = req.body;
    if (!restaurantId || !code) {
      return errorResponse(res, 'Restaurant ID and Coupon Code are required', 400);
    }
    const result = await offersService.validateCoupon(restaurantId, code, orderAmount || 0);
    return successResponse(res, result, 'Coupon applied successfully');
  } catch (err) {
    next(err);
  }
};

const createOffer = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { code, discount_value } = req.body;
    if (!code || !discount_value) {
      return errorResponse(res, 'Promo code and discount value are required', 400);
    }
    const offer = await offersService.createOffer(restaurantId, req.body);
    return successResponse(res, offer, 'Offer created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const toggleOfferStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offer = await offersService.toggleOfferStatus(id);
    return successResponse(res, offer, 'Offer status updated');
  } catch (err) {
    next(err);
  }
};

const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await offersService.deleteOffer(id);
    return successResponse(res, result, 'Offer deleted');
  } catch (err) {
    next(err);
  }
};

const getAllPublicOffers = async (req, res, next) => {
  try {
    const offers = await offersService.getAllPublicOffers();
    return successResponse(res, offers);
  } catch (err) {
    next(err);
  }
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
