const waitlistService = require('../services/waitlist.service');
const { successResponse, errorResponse } = require('../utils/response');

const joinWaitlist = async (req, res, next) => {
  try {
    const { 
      restaurantId, 
      restaurant_id, 
      customerName, 
      guestName, 
      customerPhone, 
      guestPhone, 
      partySize, 
      party_size 
    } = req.body;
    
    const restId = restaurantId || restaurant_id;
    const name = customerName || guestName || req.user?.name || 'Valued Guest';
    const phone = customerPhone || guestPhone || req.user?.phone || '+91 98765 43210';
    const size = parseInt(partySize || party_size || 2, 10);

    if (!restId) {
      return errorResponse(res, 'Restaurant ID is required', 400);
    }
    
    const entry = await waitlistService.joinWaitlist({
      restaurantId: restId,
      userId: req.user?.id || null,
      customerName: name,
      customerPhone: phone,
      partySize: size
    });
    return successResponse(res, entry, 'Added to waitlist', 201);
  } catch (error) {
    next(error);
  }
};


const getRestaurantWaitlist = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const list = await waitlistService.getRestaurantWaitlist(restaurantId);
    return successResponse(res, list);
  } catch (error) {
    next(error);
  }
};

const updateWaitlistStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }
    const updated = await waitlistService.updateWaitlistStatus(id, status);
    return successResponse(res, updated, 'Waitlist status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinWaitlist,
  getRestaurantWaitlist,
  updateWaitlistStatus
};
