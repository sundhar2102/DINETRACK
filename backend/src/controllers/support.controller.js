const supportService = require('../services/support.service');
const { successResponse, errorResponse } = require('../utils/response');

const getTicketsByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const tickets = await supportService.getTicketsByRestaurant(restaurantId);
    return successResponse(res, tickets);
  } catch (err) {
    next(err);
  }
};

const createSupportTicket = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { subject, message } = req.body;
    if (!subject || !message) {
      return errorResponse(res, 'Subject and message are required', 400);
    }
    const ticket = await supportService.createSupportTicket(restaurantId, req.user.id, req.body);
    return successResponse(res, ticket, 'Ticket submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTicketsByRestaurant,
  createSupportTicket
};
