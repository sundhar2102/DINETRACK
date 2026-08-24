import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, AlertCircle, Clock, User, Utensils, ArrowRight } from 'lucide-react';
import { reservationApi, tableApi, orderApi } from '../../api';

export default function CustomerCheckIn({ restaurantId, reservations, onCheckInComplete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRes, setSelectedRes] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter pending / confirmed reservations
  const pendingReservations = reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING');

  const filtered = pendingReservations.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.table_number && r.table_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePerformCheckIn = async (res) => {
    setProcessing(true);
    try {
      // 1. Update reservation to SEATED
      await reservationApi.updateStatus(res.id, 'SEATED');

      // 2. If table is assigned, set table to OCCUPIED
      if (res.table_id) {
        await tableApi.updateStatus(res.table_id, 'OCCUPIED');
      }

      // 3. If pre-order attached, trigger kitchen PREPARING
      if (res.order_id) {
        await orderApi.updateStatus(res.order_id, 'PREPARING');
      }

      setSuccessMessage(`Diner checked in successfully! Table ${res.table_number || 'Assigned'} is now OCCUPIED.`);
      setSelectedRes(null);
      if (onCheckInComplete) onCheckInComplete();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to complete check-in');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-orange-400" />
          <span>Host Desk Check-In & Arrival Verification</span>
        </h2>
        <p className="text-xs text-gray-400">Verify customer reservation codes, pair tables, and start kitchen prep tickets</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* QR Scanner Simulation / Fast Lookup */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Scan or type Booking ID / Table # (e.g. T-01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-xs"
            />
          </div>

          <button
            onClick={() => {
              if (pendingReservations[0]) handlePerformCheckIn(pendingReservations[0]);
            }}
            disabled={pendingReservations.length === 0}
            className="py-3 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow flex items-center justify-center gap-2 shrink-0 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Simulate QR Camera Scan</span>
          </button>
        </div>

        {/* Expected Arrivals List */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Expected Confirmed Arrivals ({filtered.length})
          </span>

          {filtered.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">No pending check-ins matching your search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-orange-500/40 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">Booking #{res.id.slice(0, 8)}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {res.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        {res.reservation_time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        {res.guest_count} Guests
                      </span>
                      <span>•</span>
                      <span className="font-bold text-white">
                        Table: {res.table_number || 'Auto-Assign'}
                      </span>
                    </div>

                    {res.order_id && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-1">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Pre-Order Attached (${Number(res.order_total || 0).toFixed(2)})</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handlePerformCheckIn(res)}
                    disabled={processing}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-in & Seat Diner</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
