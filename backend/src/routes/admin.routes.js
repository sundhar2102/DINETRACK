const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Routes accessible by App Admins
router.get('/overview', authenticate, adminController.getAdminOverview);
router.get('/revenue', authenticate, adminController.getAdminRevenueBreakdown);
router.get('/users', authenticate, adminController.getAdminUsers);
router.get('/restaurants', authenticate, adminController.getAllRestaurants);
router.patch('/restaurants/:id/approve', authenticate, adminController.approveRestaurant);
router.patch('/restaurants/:id/reject', authenticate, adminController.rejectRestaurant);


module.exports = router;
