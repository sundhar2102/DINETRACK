const waitTimeService = require('../services/waitTime.service');
const prepTimingService = require('../services/prepTiming.service');
const { successResponse, errorResponse } = require('../utils/response');

const getWaitTime = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { partySize } = req.query;
    const result = await waitTimeService.estimateWaitTime(restaurantId, partySize ? parseInt(partySize, 10) : 2);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

const getPrepTiming = async (req, res, next) => {
  try {
    const { travelTimeMinutes, tableWaitTimeMinutes, items } = req.body;
    const timing = prepTimingService.calculateIntelligentPrepTiming({
      travelTimeMinutes: Number(travelTimeMinutes || 15),
      tableWaitTimeMinutes: Number(tableWaitTimeMinutes || 0),
      items: items || []
    });
    return successResponse(res, timing);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWaitTime,
  getPrepTiming
};
