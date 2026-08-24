import React from 'react';
import { DollarSign, TrendingUp, Users, CalendarCheck, Clock, Award } from 'lucide-react';

export default function AnalyticsCards({ stats }) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      
      {/* 4 Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card rounded-3xl p-5 border border-emerald-500/20 bg-emerald-950/10 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
            <DollarSign className="w-5 h-5 p-1 rounded-lg bg-emerald-500/20" />
          </div>
          <p className="text-2xl font-black text-white">
            ${Number(stats.todayRevenue || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-gray-400">
            From {stats.todayOrders || 0} completed orders
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-orange-500/20 bg-orange-950/10 space-y-2">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-xs font-bold uppercase tracking-wider">Floor Occupancy</span>
            <TrendingUp className="w-5 h-5 p-1 rounded-lg bg-orange-500/20" />
          </div>
          <p className="text-2xl font-black text-white">
            {stats.occupancyPercentage || 0}%
          </p>
          <p className="text-[11px] text-gray-400">
            {stats.occupiedTables || 0} of {stats.totalTables || 0} tables occupied
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-blue-500/20 bg-blue-950/10 space-y-2">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Bookings</span>
            <CalendarCheck className="w-5 h-5 p-1 rounded-lg bg-blue-500/20" />
          </div>
          <p className="text-2xl font-black text-white">
            {stats.activeReservations || 0}
          </p>
          <p className="text-[11px] text-gray-400">
            Active confirmed reservations
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-amber-500/20 bg-amber-950/10 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Waitlist Queue</span>
            <Clock className="w-5 h-5 p-1 rounded-lg bg-amber-500/20" />
          </div>
          <p className="text-2xl font-black text-white">
            {stats.waitlistQueue || 0}
          </p>
          <p className="text-[11px] text-gray-400">
            Parties waiting in queue
          </p>
        </div>

      </div>

      {/* Top Selling Items */}
      {stats.topItems && stats.topItems.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400" />
            Top Selling Dishes Today
          </h4>

          <div className="space-y-2">
            {stats.topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800/60 text-xs">
                <span className="font-medium text-gray-200">
                  {idx + 1}. {item.item_name}
                </span>
                <div className="flex items-center gap-4 text-gray-400">
                  <span>{item.total_sold} units sold</span>
                  <span className="font-bold text-orange-400">
                    ${Number(item.total_revenue || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
