const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId/sales', authenticate, authorize('OWNER', 'ADMIN'), reportsController.getSalesReport);
router.get('/restaurant/:restaurantId/tables', authenticate, authorize('OWNER', 'ADMIN'), reportsController.getTableUtilizationReport);
router.get('/restaurant/:restaurantId/export/sales-csv', authenticate, authorize('OWNER', 'ADMIN'), reportsController.exportSalesCsv);

module.exports = router;
