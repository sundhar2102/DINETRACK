import React, { useEffect, useState } from 'react';
import { ShoppingBag, Clock, Utensils, CheckCircle2, ArrowRight } from 'lucide-react';
import { orderApi } from '../api';
import { useNavigate } from 'react-router-dom';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderApi.getMy();
        setOrders(res.data || []);
      } catch (e) {
        console.error('Failed to load orders:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Your Food Pre-Orders</h1>
        <p className="text-xs text-gray-400">Order receipts and kitchen preparation history</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-card rounded-3xl h-36 animate-pulse bg-gray-800/40" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-gray-400 border border-gray-800 space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-600" />
          <h3 className="text-base font-bold text-white">No pre-orders placed yet</h3>
          <p className="text-xs text-gray-500">Explore restaurant menus and pre-order meals for fast seating.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                <div>
                  <h3 className="font-bold text-base text-white">{ord.restaurant_name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Order #{ord.id.slice(0, 8)} • {new Date(ord.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-orange-400">
                    ${Number(ord.total_amount).toFixed(2)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {ord.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 text-xs text-gray-300">
                {ord.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.item_name} {item.customization_notes ? `(${item.customization_notes})` : ''}</span>
                    <span className="text-gray-400 font-medium">${Number(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {ord.reservation_id && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => navigate(`/tracking/${ord.reservation_id}`)}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
                  >
                    <span>View Live Dining Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
