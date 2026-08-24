const paymentService = require('../services/payment.service');
const { successResponse, errorResponse } = require('../utils/response');

const createPaymentOrder = async (req, res, next) => {
  try {
    const { reservationId, orderId } = req.body;
    if (!reservationId && !orderId) {
      return errorResponse(res, 'reservationId or orderId is required', 400);
    }

    const orderData = await paymentService.createPaymentOrder({
      userId: req.user.id,
      reservationId,
      orderId
    });

    return successResponse(res, orderData, 'Payment order created successfully', 200);
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      reservationId,
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod
    } = req.body;

    const result = await paymentService.verifyPayment({
      userId: req.user.id,
      reservationId,
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod
    });

    return successResponse(res, result, 'Payment verified successfully', 200);
  } catch (error) {
    next(error);
  }
};

const getPaymentByReservation = async (req, res, next) => {
  try {
    const { reservationId } = req.params;
    const payment = await paymentService.getPaymentByReservationId(reservationId, req.user.id);
    return successResponse(res, payment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentByReservation
};
