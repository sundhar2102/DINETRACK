const settingsService = require('../services/settings.service');
const { successResponse } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const settings = await settingsService.getSettings(restaurantId);
    return successResponse(res, settings);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const settings = await settingsService.updateSettings(restaurantId, req.body, req.user?.id);
    return successResponse(res, settings, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const logs = await settingsService.getActivityLogs(restaurantId);
    return successResponse(res, logs);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getActivityLogs
};
