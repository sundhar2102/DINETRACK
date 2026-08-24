const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Payment Order Creation
router.post('/create-order', authenticate, paymentController.createPaymentOrder);

// Payment Verification
router.post('/verify', authenticate, paymentController.verifyPayment);

// Get Payment Details for Reservation
router.get('/:reservationId', authenticate, paymentController.getPaymentByReservation);

module.exports = router;
