const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlist.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, waitlistController.joinWaitlist);
router.get('/restaurant/:restaurantId', authenticate, waitlistController.getRestaurantWaitlist);
router.patch('/:id/status', authenticate, waitlistController.updateWaitlistStatus);

module.exports = router;
