const orderService = require('../services/order.service');
const { successResponse, errorResponse } = require('../utils/response');

const createOrder = async (req, res, next) => {
  try {
    const { restaurantId, reservationId, tableId, orderType, items, specialInstructions, paymentMethod } = req.body;
    if (!restaurantId || !items || !items.length) {
      return errorResponse(res, 'Restaurant and at least one item are required', 400);
    }
    const order = await orderService.createOrder({
      userId: req.user.id,
      restaurantId,
      reservationId,
      tableId,
      orderType,
      items,
      specialInstructions,
      paymentMethod
    });
    return successResponse(res, order, 'Order placed successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    return successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

const getRestaurantOrders = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;
    const orders = await orderService.getRestaurantOrders(restaurantId, status);
    return successResponse(res, orders);
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
    return successResponse(res, orders);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }
    const order = await orderService.updateOrderStatus(id, status);
    return successResponse(res, order, 'Order status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getRestaurantOrders,
  getUserOrders,
  updateOrderStatus
};
