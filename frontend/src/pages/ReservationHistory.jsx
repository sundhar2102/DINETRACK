import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, Users, ArrowRight, Utensils, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
import { reservationApi } from '../api';

export default function ReservationHistory() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
  const navigate = useNavigate();

  const fetchReservations = async () => {
    try {
      const res = await reservationApi.getMy();
      setReservations(res.data || []);
    } catch (e) {
      console.error('Failed to load reservations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filtered = activeTab === 'ALL'
    ? reservations
    : reservations.filter(r => r.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20 bg-[#0B0F19]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Your Dining Bookings</h1>
          <p className="text-xs sm:text-sm text-gray-400">Track and manage upcoming and past restaurant table reservations</p>
        </div>

        <Link
          to="/restaurants"
          className="py-2.5 px-5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Book New Table</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#161F30] p-1.5 rounded-2xl border border-gray-800 shadow-xs overflow-x-auto scrollbar-none">
        {['ALL', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#FF6A00] text-white shadow-xs'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab === 'ALL' ? 'All Bookings' : tab}
          </button>
        ))}
      </div>

      {/* Reservation Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#161F30] rounded-3xl h-36 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800 space-y-4 shadow-sm">
          <CalendarCheck className="w-12 h-12 mx-auto text-gray-500" />
          <div>
            <h3 className="text-base font-bold text-white">No bookings found</h3>
            <p className="text-xs text-gray-400 mt-1">Discover top restaurants and reserve a table ahead of time.</p>
          </div>
          <Link to="/restaurants" className="inline-block py-2.5 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm">
            Find Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((res) => {
            const isConfirmed = res.status === 'CONFIRMED';
            const isSeated = res.status === 'SEATED';
            const isCompleted = res.status === 'COMPLETED';

            return (
              <div
                key={res.id}
                className="bg-[#161F30] rounded-3xl p-6 border border-gray-800 shadow-sm hover:shadow-xl hover:border-gray-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {res.restaurant_image && (
                    <img
                      src={res.restaurant_image}
                      alt={res.restaurant_name}
                      className="w-20 h-20 rounded-2xl object-cover border border-gray-700"
                    />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{res.restaurant_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isSeated 
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30' 
                          : isConfirmed
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : isCompleted
                          ? 'bg-gray-800 text-gray-300 border border-gray-700'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                        {res.reservation_date} at {res.reservation_time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {res.guest_count} Guests
                      </span>
                      <span>•</span>
                      <span className="font-bold text-gray-200">
                        Table: {res.table_number || 'Auto-Assigned'}
                      </span>
                    </div>

                    {res.order_id && (
                      <p className="text-xs text-emerald-400 font-medium pt-0.5">
                        Pre-Order Included • ₹{Number(res.order_total || 0).toFixed(0)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/tracking/${res.id}`)}
                    className="py-2.5 px-5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>View Booking Pass</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
