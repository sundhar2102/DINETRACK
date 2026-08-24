const inventoryService = require('../services/inventory.service');
const { successResponse, errorResponse } = require('../utils/response');

const getInventoryByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const items = await inventoryService.getInventoryByRestaurant(restaurantId);
    return successResponse(res, items);
  } catch (err) {
    next(err);
  }
};

const getLowStockAlerts = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const items = await inventoryService.getLowStockAlerts(restaurantId);
    return successResponse(res, items);
  } catch (err) {
    next(err);
  }
};

const createInventoryItem = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { item_name, quantity, unit } = req.body;
    if (!item_name) {
      return errorResponse(res, 'Item name is required', 400);
    }
    const item = await inventoryService.createInventoryItem(restaurantId, req.body);
    return successResponse(res, item, 'Inventory item created', 201);
  } catch (err) {
    next(err);
  }
};

const updateStockQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, action } = req.body;
    const item = await inventoryService.updateStockQuantity(id, { quantity, action });
    return successResponse(res, item, 'Stock updated');
  } catch (err) {
    next(err);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await inventoryService.deleteInventoryItem(id);
    return successResponse(res, result, 'Inventory item deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventoryByRestaurant,
  getLowStockAlerts,
  createInventoryItem,
  updateStockQuantity,
  deleteInventoryItem
};
