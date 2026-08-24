const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'STAFF', 'ADMIN'), settingsController.getSettings);
router.patch('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), settingsController.updateSettings);
router.get('/restaurant/:restaurantId/logs', authenticate, authorize('OWNER', 'ADMIN'), settingsController.getActivityLogs);

module.exports = router;
