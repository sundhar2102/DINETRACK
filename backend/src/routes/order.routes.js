const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, orderController.createOrder);
router.get('/my', authenticate, orderController.getUserOrders);
router.get('/restaurant/:restaurantId', authenticate, orderController.getRestaurantOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/status', authenticate, orderController.updateOrderStatus);

module.exports = router;
