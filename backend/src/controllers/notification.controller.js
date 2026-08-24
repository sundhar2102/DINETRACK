const notificationService = require('../services/notification.service');
const { successResponse } = require('../utils/response');

const getUserNotifications = async (req, res, next) => {
  try {
    const notifs = await notificationService.getUserNotifications(req.user.id);
    return successResponse(res, notifs);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);
    return successResponse(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
