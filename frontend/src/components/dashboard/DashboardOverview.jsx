import React from 'react';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  Utensils, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Plus
} from 'lucide-react';

export default function DashboardOverview({ 
  stats, 
  tables, 
  orders, 
  reservations, 
  waitlist, 
  lowStockItems, 
  onNavigateTab 
}) {
  const availableTables = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;
  const activeOrders = orders.filter(o => o.status !== 'SERVED' && o.status !== 'CANCELLED');
  const todayReservations = reservations.filter(r => r.status === 'CONFIRMED');

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner with Real-time Status */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-gray-900/60 to-amber-950/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DINING SHIFT ACTIVE
            </span>
            <span className="text-xs text-gray-400">• {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">Live Restaurant Command Center</h2>
          <p className="text-xs text-gray-300 max-w-xl">
            Synchronized floor availability, kitchen prep tickets, table bookings, and inventory tracking in real time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('checkin')}
            className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>QR Check-in</span>
          </button>

          <button
            onClick={() => onNavigateTab('reservations')}
            className="py-2.5 px-4 rounded-xl glass-panel hover:bg-gray-800 text-gray-200 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Critical Operational Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-300">Inventory Alert: </span>
              <span className="text-gray-300">
                {lowStockItems.length} ingredient(s) below minimum stock threshold ({lowStockItems.map(i => i.item_name).slice(0, 2).join(', ')}).
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-xs font-bold text-amber-400 hover:underline shrink-0 flex items-center gap-1"
          >
            <span>View Stock</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Core Shift Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('floor')}
          className="glass-card rounded-2xl p-5 border border-gray-800 hover:border-orange-500/40 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">Floor Occupancy</span>
            <Utensils className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {occupiedTables} / {tables.length}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
            <span>{availableTables} Tables Ready</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('kitchen')}
          className="glass-card rounded-2xl p-5 border border-gray-800 hover:border-orange-500/40 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">Kitchen Tickets</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {activeOrders.length}
          </div>
          <div className="text-[11px] text-amber-400 font-bold">
            <span>Active KDS Queue</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('reservations')}
          className="glass-card rounded-2xl p-5 border border-gray-800 hover:border-orange-500/40 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">Bookings Today</span>
            <CalendarCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {todayReservations.length}
          </div>
          <div className="text-[11px] text-blue-400 font-bold">
            <span>Confirmed Dine-Ins</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('analytics')}
          className="glass-card rounded-2xl p-5 border border-gray-800 hover:border-orange-500/40 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold">Today's Gross Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${Number(stats?.todayRevenue || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            <span>{stats?.ordersCount || 0} Orders Fulfilled</span>
          </div>
        </div>
      </div>

      {/* Two Column Operational Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Waitlist & Host Desk */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-base text-white">Walk-in Waitlist ({waitlist.length})</h3>
            </div>
            <button
              onClick={() => onNavigateTab('waitlist')}
              className="text-xs text-orange-400 hover:underline font-bold"
            >
              Manage Queue
            </button>
          </div>

          {waitlist.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No guests waiting in line currently.</p>
          ) : (
            <div className="space-y-2.5">
              {waitlist.slice(0, 3).map((w, idx) => (
                <div key={w.id} className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">#{idx + 1} {w.customer_name}</span>
                    <span className="text-gray-400 text-[11px]">Party of {w.party_size} • Joined {new Date(w.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    ~{w.estimated_wait_minutes}m wait
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Kitchen Feed */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-base text-white">Active Kitchen Tickets ({activeOrders.length})</h3>
            </div>
            <button
              onClick={() => onNavigateTab('kitchen')}
              className="text-xs text-orange-400 hover:underline font-bold"
            >
              Open KDS Screen
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">All kitchen prep tickets served!</p>
          ) : (
            <div className="space-y-2.5">
              {activeOrders.slice(0, 3).map((ord) => (
                <div key={ord.id} className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">Table: {ord.table_number || 'Pre-Order'}</span>
                    <span className="text-gray-400 text-[11px]">{ord.items?.length || 1} Items • ${Number(ord.total_amount).toFixed(2)}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {ord.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
