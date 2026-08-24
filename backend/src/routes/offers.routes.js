const express = require('express');
const router = express.Router();
const offersController = require('../controllers/offers.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/all', offersController.getAllPublicOffers);
router.get('/', offersController.getAllPublicOffers);
router.get('/restaurant/:restaurantId', offersController.getOffersByRestaurant);
router.get('/restaurant/:restaurantId/active', offersController.getActiveOffers);
router.post('/validate', offersController.validateCoupon);
router.post('/:restaurantId/validate', (req, res, next) => {
  req.body.restaurantId = req.params.restaurantId;
  offersController.validateCoupon(req, res, next);
});
router.post('/restaurant/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), offersController.createOffer);
router.patch('/:id/toggle', authenticate, authorize('OWNER', 'ADMIN'), offersController.toggleOfferStatus);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), offersController.deleteOffer);

module.exports = router;
