const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/all', eventsController.getAllPublicEvents);
router.get('/', eventsController.getAllPublicEvents);
router.get('/restaurant/:restaurantId', eventsController.getEventsByRestaurant);
router.get('/restaurant/:restaurantId/upcoming', eventsController.getUpcomingPublicEvents);
router.post('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), eventsController.createEvent);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), eventsController.deleteEvent);

module.exports = router;
