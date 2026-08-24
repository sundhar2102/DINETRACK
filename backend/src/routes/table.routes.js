const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', tableController.getTablesByRestaurantId);
router.patch('/:id/status', authenticate, tableController.updateTableStatus);
router.put('/:id/status', authenticate, tableController.updateTableStatus);
router.post('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN', 'STAFF'), tableController.createTable);
router.patch('/:id', authenticate, authorize('OWNER', 'ADMIN', 'STAFF'), tableController.updateTable);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), tableController.deleteTable);

module.exports = router;
