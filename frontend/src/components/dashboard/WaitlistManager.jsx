import React from 'react';
import { Clock, Users, Phone, Bell, CheckCircle2, X } from 'lucide-react';
import { waitlistApi } from '../../api';

export default function WaitlistManager({ waitlist = [], onWaitlistUpdated }) {
  const handleUpdateStatus = async (id, status) => {
    try {
      await waitlistApi.updateStatus(id, status);
      if (onWaitlistUpdated) onWaitlistUpdated();
    } catch (e) {
      alert('Failed to update waitlist: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Live Customer Waitlist & Queue
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage live walk-in waiting queue and notify customers when their table is ready.
          </p>
        </div>

        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-xl">
          {waitlist.length} Waiting Parties
        </span>
      </div>

      {waitlist.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center text-gray-400 border border-gray-800">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-bold text-white">Waitlist is currently empty</p>
          <p className="text-xs text-gray-500 mt-0.5">When walk-in parties join the queue, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlist.map((entry, idx) => {
            const isNotified = entry.status === 'NOTIFIED';

            return (
              <div
                key={entry.id}
                className={`glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${
                  isNotified ? 'border-amber-500/40 bg-amber-950/20' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 font-black text-sm flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{entry.customer_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-500" />
                        {entry.customer_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        Party of {entry.party_size}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(entry.id, 'NOTIFIED')}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      isNotified
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'bg-amber-500 hover:bg-amber-600 text-black shadow'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{isNotified ? 'Notified Table Ready' : 'Call / Notify'}</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(entry.id, 'SEATED')}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Seat Party</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(entry.id, 'CANCELLED')}
                    className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-500 hover:text-rose-400"
                    title="Remove from queue"
                  >
                    <X className="w-4 h-4" />
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
