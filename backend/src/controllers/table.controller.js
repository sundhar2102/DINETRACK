const tableService = require('../services/table.service');
const { successResponse, errorResponse } = require('../utils/response');

const getTablesByRestaurantId = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const tables = await tableService.getTablesByRestaurantId(restaurantId);
    return successResponse(res, tables);
  } catch (error) {
    next(error);
  }
};

const updateTableStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 'Table status is required', 400);
    }
    const updated = await tableService.updateTableStatus(id, status, req.user ? req.user.id : null);
    return successResponse(res, updated, 'Table status updated');
  } catch (error) {
    next(error);
  }
};

const createTable = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { table_number, capacity, section } = req.body;
    if (!table_number || !capacity) {
      return errorResponse(res, 'Table number and capacity are required', 400);
    }
    const table = await tableService.createTable(restaurantId, { table_number, capacity, section });
    return successResponse(res, table, 'Table created', 201);
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await tableService.updateTable(id, req.body);
    return successResponse(res, table, 'Table updated');
  } catch (error) {
    next(error);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await tableService.deleteTable(id);
    return successResponse(res, result, 'Table deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTablesByRestaurantId,
  updateTableStatus,
  createTable,
  updateTable,
  deleteTable
};
