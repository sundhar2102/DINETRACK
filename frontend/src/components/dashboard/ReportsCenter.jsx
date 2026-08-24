import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api';
import { FileText, Download, TrendingUp, Layers, Calendar, ArrowDownToLine } from 'lucide-react';

export default function ReportsCenter({ restaurantId }) {
  const [salesReport, setSalesReport] = useState([]);
  const [tableReport, setTableReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          reportsApi.getSales(restaurantId),
          reportsApi.getTableUtilization(restaurantId)
        ]);
        setSalesReport(sRes.data || []);
        setTableReport(tRes.data || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [restaurantId]);

  const handleDownloadCsv = () => {
    window.open(reportsApi.getCsvDownloadUrl(restaurantId), '_blank');
  };

  if (loading) {
    return <div className="glass-card rounded-3xl h-72 animate-pulse bg-gray-800/40" />;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <span>Business Reports & Sales Audits</span>
          </h2>
          <p className="text-xs text-gray-400">Export financial summaries, table turnover metrics, and daily sales CSV data</p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Daily Sales Breakdown */}
      <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Daily Sales Summary</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 uppercase text-[11px] border-b border-gray-800 pb-3">
                <th className="pb-3 font-bold">Date</th>
                <th className="pb-3 font-bold text-center">Orders</th>
                <th className="pb-3 font-bold text-right">Gross Sales</th>
                <th className="pb-3 font-bold text-right">Taxes</th>
                <th className="pb-3 font-bold text-right">Net Revenue</th>
                <th className="pb-3 font-bold text-right">Avg Ticket Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {salesReport.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">No sales records logged yet.</td>
                </tr>
              ) : (
                salesReport.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-900/40 transition-all">
                    <td className="py-3 font-bold text-white">{row.sale_date}</td>
                    <td className="py-3 text-center text-gray-300">{row.order_count}</td>
                    <td className="py-3 text-right text-gray-400">${Number(row.gross_sales || 0).toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-400">${Number(row.total_tax || 0).toFixed(2)}</td>
                    <td className="py-3 text-right font-black text-emerald-400">${Number(row.net_revenue || 0).toFixed(2)}</td>
                    <td className="py-3 text-right text-orange-400 font-bold">${Number(row.average_ticket_size || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Efficiency & Utilization */}
      <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" />
          <span>Table Productivity & Turnover Report</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tableReport.map((t, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-white text-sm">Table {t.table_number}</span>
                <span className="text-gray-400">{t.section} • {t.capacity} Seats</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800 text-gray-400">
                <span>{t.total_reservations_served} Parties Served</span>
                <span className="font-bold text-emerald-400">${Number(t.revenue_generated || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
