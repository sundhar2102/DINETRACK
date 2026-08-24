const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/restaurant/:restaurantId', authenticate, supportController.getTicketsByRestaurant);
router.post('/restaurant/:restaurantId', authenticate, supportController.createSupportTicket);

module.exports = router;
