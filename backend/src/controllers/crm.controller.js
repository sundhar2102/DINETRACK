const crmService = require('../services/crm.service');
const { successResponse } = require('../utils/response');

const getRestaurantCustomers = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { search, filter } = req.query;
    const customers = await crmService.getRestaurantCustomers(restaurantId, { search, filter });
    return successResponse(res, customers);
  } catch (err) {
    next(err);
  }
};

const getCustomerDetails = async (req, res, next) => {
  try {
    const { restaurantId, userId } = req.params;
    const details = await crmService.getCustomerDetails(restaurantId, userId);
    return successResponse(res, details);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRestaurantCustomers,
  getCustomerDetails
};
