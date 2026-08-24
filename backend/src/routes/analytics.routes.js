const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN', 'STAFF'), analyticsController.getRestaurantAnalytics);

module.exports = router;
