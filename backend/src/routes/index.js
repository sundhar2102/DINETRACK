const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const restaurantRoutes = require('./restaurant.routes');
const tableRoutes = require('./table.routes');
const waitTimeRoutes = require('./waitTime.routes');
const reservationRoutes = require('./reservation.routes');
const orderRoutes = require('./order.routes');
const waitlistRoutes = require('./waitlist.routes');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const menuRoutes = require('./menu.routes');
const reviewRoutes = require('./review.routes');
const paymentRoutes = require('./payment.routes');

// New Owner Platform Routes
const offersRoutes = require('./offers.routes');
const inventoryRoutes = require('./inventory.routes');
const crmRoutes = require('./crm.routes');
const eventsRoutes = require('./events.routes');
const reportsRoutes = require('./reports.routes');
const settingsRoutes = require('./settings.routes');
const supportRoutes = require('./support.routes');
const staffRoutes = require('./staff.routes');
const adminRoutes = require('./admin.routes');

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/tables', tableRoutes);
router.use('/wait-time', waitTimeRoutes);
router.use('/reservations', reservationRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/menu', menuRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);


// New Modules
router.use('/offers', offersRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/crm', crmRoutes);
router.use('/events', eventsRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/support', supportRoutes);
router.use('/staff', staffRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SmartTable AI Platform API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
