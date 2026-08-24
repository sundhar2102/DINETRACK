const express = require('express');
const router = express.Router();
const waitTimeController = require('../controllers/waitTime.controller');

router.get('/:restaurantId', waitTimeController.getWaitTime);
router.post('/prep-timing', waitTimeController.getPrepTiming);

module.exports = router;
