const eventsService = require('../services/events.service');
const { successResponse, errorResponse } = require('../utils/response');

const getEventsByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const events = await eventsService.getEventsByRestaurant(restaurantId);
    return successResponse(res, events);
  } catch (err) {
    next(err);
  }
};

const getUpcomingPublicEvents = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const events = await eventsService.getUpcomingPublicEvents(restaurantId);
    return successResponse(res, events);
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { title, event_date, event_time } = req.body;
    if (!title || !event_date || !event_time) {
      return errorResponse(res, 'Title, event date, and event time are required', 400);
    }
    const event = await eventsService.createEvent(restaurantId, req.body);
    return successResponse(res, event, 'Event created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await eventsService.deleteEvent(id);
    return successResponse(res, result, 'Event deleted');
  } catch (err) {
    next(err);
  }
};

const getAllPublicEvents = async (req, res, next) => {
  try {
    const events = await eventsService.getAllPublicEvents();
    return successResponse(res, events);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEventsByRestaurant,
  getUpcomingPublicEvents,
  getAllPublicEvents,
  createEvent,
  deleteEvent
};
