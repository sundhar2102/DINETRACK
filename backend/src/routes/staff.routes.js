const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), staffController.getStaffByRestaurant);
router.post('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), staffController.addStaffMember);
router.patch('/:id', authenticate, authorize('OWNER', 'ADMIN'), staffController.updateStaffRole);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), staffController.removeStaffMember);

module.exports = router;
