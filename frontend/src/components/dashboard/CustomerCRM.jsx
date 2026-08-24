import React, { useState, useEffect } from 'react';
import { crmApi } from '../../api';
import { Users, Search, Award, DollarSign, Calendar, Heart, Eye } from 'lucide-react';

export default function CustomerCRM({ restaurantId }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'VIP', 'REGULAR'

  const fetchCustomers = async () => {
    try {
      const res = await crmApi.getCustomers(restaurantId, { search, filter });
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to load CRM diners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [restaurantId, filter]);

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const res = await crmApi.getCustomerDetails(restaurantId, cust.user_id);
      setCustomerDetails(res.data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            <span>Customer Relationship Management (CRM)</span>
          </h2>
          <p className="text-xs text-gray-400">Guest dining histories, lifetime spend, VIP tags, and favorite dishes</p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          {['ALL', 'VIP', 'REGULAR'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                filter === f ? 'bg-orange-500 text-white shadow-glow' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All Diners' : f === 'VIP' ? 'VIP Guests ⭐' : 'Regulars'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Directory */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-800/40 animate-pulse" />)}
              </div>
            ) : customers.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No customer records found.</p>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomer?.user_id === c.user_id;
                return (
                  <div
                    key={c.user_id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/50'
                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        c.guest_tier === 'VIP' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {c.guest_tier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>{c.total_reservations} Dine-Ins</span>
                      <span className="font-bold text-emerald-400">${Number(c.lifetime_spend).toFixed(2)} Spend</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Guest Profile Details */}
        <div className="lg:col-span-2">
          {customerDetails ? (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
              
              <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
                <img
                  src={customerDetails.customer.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={customerDetails.customer.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-700"
                />
                <div>
                  <h3 className="font-bold text-lg text-white">{customerDetails.customer.name}</h3>
                  <p className="text-xs text-gray-400">{customerDetails.customer.email} • {customerDetails.customer.phone || 'No phone'}</p>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Diner since {new Date(customerDetails.customer.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Favorite Dishes */}
              {customerDetails.favoriteDishes?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    Frequent Preferences & Favorite Dishes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {customerDetails.favoriteDishes.map((fd, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200">
                        {fd.item_name} <span className="text-orange-400 font-bold">({fd.order_count}x)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reservation History */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Past Bookings ({customerDetails.reservations?.length || 0})
                </span>

                <div className="space-y-2">
                  {customerDetails.reservations?.slice(0, 5).map((r) => (
                    <div key={r.id} className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{r.reservation_date} at {r.reservation_time}</span>
                        <span className="text-gray-400 text-[11px]">Table {r.table_number || 'N/A'} • {r.guest_count} Guests</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {r.status}
                        </span>
                        {r.order_total && (
                          <span className="block text-[11px] text-gray-400 mt-0.5">${Number(r.order_total).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center text-gray-500 border border-gray-800">
              Select a diner from the guest list to view their visit history and preferences.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
