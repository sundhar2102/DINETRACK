import React from 'react';
import { CalendarCheck, Users, Clock, CheckCircle, XCircle, Utensils } from 'lucide-react';
import { reservationApi } from '../../api';

export default function ReservationQueue({ reservations = [], onReservationUpdated }) {
  const handleUpdateStatus = async (id, status) => {
    try {
      await reservationApi.updateStatus(id, status);
      if (onReservationUpdated) onReservationUpdated();
    } catch (e) {
      alert('Failed to update reservation: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-orange-400" />
            Table Reservations Queue
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Upcoming and active dine-in table bookings.
          </p>
        </div>

        <span className="text-xs font-bold text-gray-400 bg-gray-800 px-3 py-1 rounded-xl">
          Total: {reservations.length} Bookings
        </span>
      </div>

      {reservations.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center text-gray-400 border border-gray-800">
          <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-bold text-white">No reservations found</p>
          <p className="text-xs text-gray-500 mt-0.5">Bookings created by customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => {
            const isConfirmed = res.status === 'CONFIRMED';
            const isCheckedIn = res.status === 'CHECKED_IN';
            const isSeated = res.status === 'SEATED';
            const isCompleted = res.status === 'COMPLETED';

            return (
              <div
                key={res.id}
                className="glass-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-800"
              >
                {/* Guest & Timing Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{res.user_name}</span>
                    <span className="text-xs text-gray-400">({res.user_phone || res.user_email})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isConfirmed ? 'bg-amber-500/20 text-amber-400' 
                      : isCheckedIn ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : isSeated ? 'bg-emerald-500/20 text-emerald-400' 
                      : isCompleted ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-800 text-gray-400'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      {res.reservation_date} at {res.reservation_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      {res.guest_count} Guests
                    </span>
                    <span className="font-bold text-white">
                      Table: {res.table_number || 'Auto-Assign'}
                    </span>
                    {res.order_id && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-semibold text-[11px]">
                        Pre-Order: ${Number(res.order_total || 0).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {res.special_requests && (
                    <p className="text-xs text-amber-300 italic pt-1">
                      Note: "{res.special_requests}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isConfirmed && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'CHECKED_IN')}
                      className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <span>📍 Check-In</span>
                    </button>
                  )}

                  {(isConfirmed || isCheckedIn) && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'SEATED')}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Seat Guest</span>
                    </button>
                  )}

                  {isSeated && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'COMPLETED')}
                      className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Finish Dining</span>
                    </button>
                  )}

                  {!isCompleted && res.status !== 'CANCELLED' && res.status !== 'NO_SHOW' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'NO_SHOW')}
                      className="py-1.5 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold"
                    >
                      <span>No-Show</span>
                    </button>
                  )}

                  {!isCompleted && res.status !== 'CANCELLED' && res.status !== 'NO_SHOW' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                      className="py-1.5 px-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
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
