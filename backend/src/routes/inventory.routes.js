const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'STAFF', 'ADMIN'), inventoryController.getInventoryByRestaurant);
router.get('/restaurant/:restaurantId/low-stock', authenticate, authorize('OWNER', 'STAFF', 'ADMIN'), inventoryController.getLowStockAlerts);
router.post('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), inventoryController.createInventoryItem);
router.patch('/:id/stock', authenticate, authorize('OWNER', 'STAFF', 'ADMIN'), inventoryController.updateStockQuantity);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), inventoryController.deleteInventoryItem);

module.exports = router;
