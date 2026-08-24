import React from 'react';
import { Bell, CheckCheck, X, Clock, CheckCircle2, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'RESERVATION_CONFIRMED':
      case 'TABLE_READY':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'FOOD_PREPARING':
      case 'FOOD_READY':
        return <UtensilsCrossed className="w-5 h-5 text-orange-400 shrink-0" />;
      case 'RESERVATION_CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-gray-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Notifications</h3>
              <p className="text-xs text-gray-400">Live updates on your bookings and food</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mark All Read Button */}
        {notifications.length > 0 && (
          <div className="flex justify-end pt-3 pb-1">
            <button
              onClick={markAllAsRead}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 py-2 space-y-2 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-gray-500">Live updates on your tables and pre-orders will appear here.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                  notif.is_read
                    ? 'bg-gray-800/40 border-gray-800/80 text-gray-300'
                    : 'bg-gray-800/90 border-orange-500/30 text-white shadow-lg'
                }`}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold">{notif.title}</h4>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-gray-500 mt-2 block">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
