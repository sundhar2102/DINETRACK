const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/restaurant/:restaurantId', reviewController.getReviewsByRestaurant);
router.post('/', authenticate, reviewController.createReview);
router.post('/:reviewId/reply', authenticate, authorize('OWNER', 'ADMIN'), reviewController.replyToReview);

module.exports = router;
