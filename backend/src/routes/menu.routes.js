const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/:restaurantId', reviewController.getMenuByRestaurant);
router.post('/items', authenticate, authorize('OWNER', 'ADMIN', 'STAFF'), reviewController.createMenuItem);
router.patch('/items/:id', authenticate, authorize('OWNER', 'ADMIN', 'STAFF'), reviewController.updateMenuItem);
router.delete('/items/:id', authenticate, authorize('OWNER', 'ADMIN'), reviewController.deleteMenuItem);

module.exports = router;
