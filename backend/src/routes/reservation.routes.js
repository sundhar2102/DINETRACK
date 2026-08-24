const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, reservationController.createReservation);
router.get('/my', authenticate, reservationController.getUserReservations);
router.get('/restaurant/:restaurantId', authenticate, reservationController.getRestaurantReservations);
router.get('/:id', authenticate, reservationController.getReservationById);
router.patch('/:id/status', authenticate, reservationController.updateReservationStatus);
router.put('/:id/status', authenticate, reservationController.updateReservationStatus);

module.exports = router;
