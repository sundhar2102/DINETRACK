import React from 'react';
import { ChefHat, Clock, CheckCircle2, Utensils, AlertCircle, Sparkles, Bell } from 'lucide-react';
import { orderApi } from '../../api';

export default function KitchenDisplay({ orders = [], onOrderStatusUpdated }) {
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      if (onOrderStatusUpdated) onOrderStatusUpdated();
    } catch (e) {
      alert('Failed to update order status: ' + e.message);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'SERVED' && o.status !== 'CANCELLED');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-400" />
            Kitchen Display System (KDS) & Live Queue
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Active pre-orders and dine-in kitchen tickets synchronized live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
            {activeOrders.length} Active Tickets
          </span>
        </div>
      </div>

      {/* Orders Grid */}
      {activeOrders.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-gray-400 border border-gray-800">
          <ChefHat className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <h4 className="text-sm font-bold text-white">Kitchen queue is clear!</h4>
          <p className="text-xs text-gray-500 mt-1">Incoming customer pre-orders will pop up here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map((ord) => {
            const isPreparing = ord.status === 'PREPARING';
            const isReady = ord.status === 'READY';
            const isConfirmed = ord.status === 'CONFIRMED';

            return (
              <div
                key={ord.id}
                className={`glass-card rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                  isReady
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                    : isPreparing
                    ? 'border-orange-500/50 bg-orange-950/20'
                    : 'border-gray-800'
                }`}
              >
                {/* Ticket Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-400">
                      #{ord.id.slice(0, 8)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isReady 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : isPreparing
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {ord.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-sm font-bold text-white">{ord.user_name || 'Guest'}</h4>
                      <p className="text-[11px] text-gray-400">
                        {ord.table_number ? `Table ${ord.table_number}` : 'Pre-Order / Arrival'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-orange-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{ord.estimated_prep_time_minutes}m Prep
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Special Kitchen Instructions */}
                  {ord.special_instructions && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                      <span className="font-bold block text-[10px] uppercase">Special Request:</span>
                      {ord.special_instructions}
                    </div>
                  )}

                  {/* Item List */}
                  <div className="space-y-1.5 py-3 border-y border-gray-800">
                    {ord.items?.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gray-800 text-orange-400 font-bold flex items-center justify-center text-[11px]">
                            {item.quantity}x
                          </span>
                          <span className="text-gray-200 font-medium">{item.item_name}</span>
                        </div>
                        {item.customization_notes && (
                          <span className="text-[10px] text-gray-400 italic">
                            ({item.customization_notes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="mt-4 pt-3 flex items-center gap-2">
                  {isConfirmed && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                      className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow transition-all"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'READY')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Mark Food as Ready</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Mark as Served</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
