const staffService = require('../services/staff.service');
const { successResponse, errorResponse } = require('../utils/response');

const getStaffByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const staff = await staffService.getStaffByRestaurant(restaurantId);
    return successResponse(res, staff);
  } catch (err) {
    next(err);
  }
};

const addStaffMember = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { name, email, staffRole } = req.body;
    if (!name || !email || !staffRole) {
      return errorResponse(res, 'Name, email, and staff role are required', 400);
    }
    const staff = await staffService.addStaffMember(restaurantId, req.body);
    return successResponse(res, staff, 'Staff member added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateStaffRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await staffService.updateStaffRole(id, req.body);
    return successResponse(res, staff, 'Staff details updated');
  } catch (err) {
    next(err);
  }
};

const removeStaffMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await staffService.removeStaffMember(id);
    return successResponse(res, result, 'Staff member removed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStaffByRestaurant,
  addStaffMember,
  updateStaffRole,
  removeStaffMember
};
