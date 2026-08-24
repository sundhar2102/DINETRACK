const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/nearby', optionalAuthenticate, restaurantController.getNearbyRestaurants);
router.get('/', optionalAuthenticate, restaurantController.getNearbyRestaurants);
router.get('/:id', optionalAuthenticate, restaurantController.getRestaurantById);
router.get('/:id/wait-time', optionalAuthenticate, restaurantController.getWaitTime);
router.post('/', authenticate, authorize('OWNER', 'ADMIN'), restaurantController.createRestaurant);
router.patch('/:id', authenticate, authorize('OWNER', 'ADMIN'), restaurantController.updateRestaurant);
router.post('/:id/clear-data', authenticate, restaurantController.clearLiveOperationalData);


module.exports = router;

