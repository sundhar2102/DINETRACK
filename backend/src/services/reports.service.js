const { getDb } = require('../../database/db');

const getSalesReport = async (restaurantId, { startDate, endDate } = {}) => {
  const db = await getDb();

  let query = `
    SELECT 
      DATE(o.created_at) as sale_date,
      COUNT(o.id) as order_count,
      SUM(o.subtotal) as gross_sales,
      SUM(o.tax) as total_tax,
      SUM(o.total_amount) as net_revenue,
      AVG(o.total_amount) as average_ticket_size
    FROM orders o
    WHERE o.restaurant_id = ? AND o.status != 'CANCELLED'
  `;
  const params = [restaurantId];

  if (startDate) {
    query += ' AND DATE(o.created_at) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND DATE(o.created_at) <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY DATE(o.created_at) ORDER BY sale_date DESC';
  return db.query(query, params);
};

const getTableUtilizationReport = async (restaurantId) => {
  const db = await getDb();
  return db.query(
    `SELECT 
       t.table_number,
       t.capacity,
       t.section,
       COUNT(DISTINCT r.id) as total_reservations_served,
       COALESCE(SUM(o.total_amount), 0) as revenue_generated
     FROM tables t
     LEFT JOIN reservations r ON t.id = r.table_id AND r.status IN ('SEATED', 'COMPLETED')
     LEFT JOIN orders o ON r.id = o.reservation_id AND o.status != 'CANCELLED'
     WHERE t.restaurant_id = ?
     GROUP BY t.id, t.table_number, t.capacity, t.section
     ORDER BY revenue_generated DESC`,
    [restaurantId]
  );
};

const exportSalesCsv = async (restaurantId) => {
  const reports = await getSalesReport(restaurantId);
  const headers = 'Date,Order Count,Gross Sales ($),Taxes ($),Net Revenue ($),Avg Ticket ($)\n';
  const rows = reports.map(r => 
    `${r.sale_date},${r.order_count},${Number(r.gross_sales || 0).toFixed(2)},${Number(r.total_tax || 0).toFixed(2)},${Number(r.net_revenue || 0).toFixed(2)},${Number(r.average_ticket_size || 0).toFixed(2)}`
  ).join('\n');

  return headers + rows;
};

module.exports = {
  getSalesReport,
  getTableUtilizationReport,
  exportSalesCsv
};
