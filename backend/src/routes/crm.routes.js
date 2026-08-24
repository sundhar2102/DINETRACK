const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crm.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'STAFF', 'ADMIN'), crmController.getRestaurantCustomers);
router.get('/restaurant/:restaurantId/customer/:userId', authenticate, authorize('OWNER', 'STAFF', 'ADMIN'), crmController.getCustomerDetails);

module.exports = router;
