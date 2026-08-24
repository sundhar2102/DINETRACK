const reportsService = require('../services/reports.service');
const { successResponse } = require('../utils/response');

const getSalesReport = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    const report = await reportsService.getSalesReport(restaurantId, { startDate, endDate });
    return successResponse(res, report);
  } catch (err) {
    next(err);
  }
};

const getTableUtilizationReport = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const report = await reportsService.getTableUtilizationReport(restaurantId);
    return successResponse(res, report);
  } catch (err) {
    next(err);
  }
};

const exportSalesCsv = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const csv = await reportsService.exportSalesCsv(restaurantId);
    res.header('Content-Type', 'text/csv');
    res.attachment(`sales_report_${restaurantId}.csv`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalesReport,
  getTableUtilizationReport,
  exportSalesCsv
};
