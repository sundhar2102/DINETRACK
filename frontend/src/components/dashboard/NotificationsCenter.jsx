import React from 'react';
import { Bell, CheckCircle2, Clock, Utensils, AlertTriangle, Users } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationsCenter() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            <span>Restaurant Operational Alerts & Notifications</span>
          </h2>
          <p className="text-xs text-gray-400">Live operational alerts, table readiness updates, and reservation confirmations</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-orange-400 hover:underline font-bold"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-3">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-gray-600" />
            <p className="text-xs">No notifications at the moment.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                n.is_read
                  ? 'bg-gray-900/30 border-gray-800/60 opacity-80'
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                {n.type === 'RESERVATION_CONFIRMED' && <Users className="w-4 h-4" />}
                {n.type === 'FOOD_PREPARING' && <Utensils className="w-4 h-4" />}
                {n.type === 'TABLE_READY' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {n.type !== 'RESERVATION_CONFIRMED' && n.type !== 'FOOD_PREPARING' && n.type !== 'TABLE_READY' && <Bell className="w-4 h-4" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white">{n.title}</h4>
                  <span className="text-[10px] text-gray-500">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
